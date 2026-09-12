import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PortProcessInfo } from '../../common/types';

const execAsync = promisify(exec);

const DEV_DEPENDENCY_DEFAULT_PORTS: Record<string, number> = {
  vite: 5173,
  next: 3000,
  '@angular/core': 4200,
  nuxt: 3000,
  gatsby: 8000,
  remix: 3000,
};

const PREFERRED_SCRIPT_NAMES = ['dev', 'start', 'serve', 'develop'];

const LOCKFILE_PACKAGE_MANAGERS: { file: string; packageManager: string }[] = [
  { file: 'bun.lockb', packageManager: 'bun' },
  { file: 'pnpm-lock.yaml', packageManager: 'pnpm' },
  { file: 'yarn.lock', packageManager: 'yarn' },
  { file: 'package-lock.json', packageManager: 'npm' },
];

interface StartTarget {
  folder: string;
  script: string;
  packageManager: string;
}

export class PortService {
  private terminal: vscode.Terminal | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Automatically detect port numbers configured in this workspace's package.json or .env files
   */
  /**
   * Recursively search for project configuration files (.env*, package.json, docker-compose*.yml)
   * across monorepos and microservices (up to 4 directory levels deep, skipping dependencies).
   */
  private findProjectConfigFiles(dir: string, maxDepth = 4, currentDepth = 0): string[] {
    if (currentDepth > maxDepth) return [];
    const results: string[] = [];

    const IGNORED = new Set([
      'node_modules',
      '.git',
      '.vscode',
      'dist',
      'build',
      '.next',
      '.nuxt',
      'out',
      '.turbo',
      'vendor',
      'target',
      'bin',
      'obj',
      '.cache',
    ]);

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!IGNORED.has(entry.name) && !entry.name.startsWith('.')) {
            results.push(...this.findProjectConfigFiles(path.join(dir, entry.name), maxDepth, currentDepth + 1));
          }
        } else if (entry.isFile()) {
          const name = entry.name.toLowerCase();
          if (
            name.startsWith('.env') ||
            name === 'package.json' ||
            name.startsWith('docker-compose')
          ) {
            results.push(path.join(dir, entry.name));
          }
        }
      }
    } catch {
      // Ignore permission or unreadable folder errors
    }

    return results;
  }

  /**
   * Automatically detect port numbers configured across this workspace or nested microservices
   */
  public async detectProjectPorts(workspaceRoot?: string): Promise<number[]> {
    const root = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root || !fs.existsSync(root)) {
      return [];
    }

    const detected = new Set<number>();
    const configFiles = this.findProjectConfigFiles(root);

    for (const filePath of configFiles) {
      const fileName = path.basename(filePath).toLowerCase();

      // 1. package.json across root or nested microservice folders
      if (fileName === 'package.json') {
        try {
          const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const scripts = pkg.scripts || {};
          const scriptText = JSON.stringify(scripts);

          const portMatches = scriptText.matchAll(/(?:--port|-p|PORT=)\s*(\d{2,5})/gi);
          for (const m of portMatches) {
            const p = parseInt(m[1], 10);
            if (p > 0 && p <= 65535) detected.add(p);
          }

          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (allDeps['next']) detected.add(3000);
          if (allDeps['vite']) detected.add(5173);
          if (allDeps['@angular/core']) detected.add(4200);
          if (allDeps['nuxt']) detected.add(3000);
          if (allDeps['gatsby']) detected.add(8000);
          if (allDeps['remix']) detected.add(3000);
        } catch {}
      }

      // 2. .env files located ANYWHERE in the workspace (nested microservices)
      if (fileName.startsWith('.env')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          for (const line of lines) {
            const m = line.match(/^(?:PORT|VITE_PORT|APP_PORT|SERVER_PORT|DEV_PORT|API_PORT|CLIENT_PORT|WEB_PORT)\s*=\s*(\d{2,5})/i);
            if (m) {
              const p = parseInt(m[1], 10);
              if (p > 0 && p <= 65535) detected.add(p);
            }

            // Also check for localhost ports in connection URLs (e.g. postgres://localhost:5432, http://localhost:8080)
            const urlPortMatches = line.matchAll(/localhost:(\d{2,5})/gi);
            for (const um of urlPortMatches) {
              const p = parseInt(um[1], 10);
              if (p > 0 && p <= 65535) detected.add(p);
            }
          }
        } catch {}
      }

      // 3. docker-compose*.yml port mappings
      if (fileName.startsWith('docker-compose')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const composePortMatches = content.matchAll(/["']?(\d{2,5}):\d{2,5}["']?/g);
          for (const cm of composePortMatches) {
            const p = parseInt(cm[1], 10);
            if (p > 0 && p <= 65535) detected.add(p);
          }
        } catch {}
      }
    }

    return Array.from(detected).sort((a, b) => a - b);
  }

  /**
   * Detect which package manager governs a folder by walking up to the workspace
   * root looking for a lockfile. Defaults to npm when no lockfile is found.
   */
  private detectPackageManager(startDir: string, workspaceRoot: string): string {
    const resolvedRoot = path.resolve(workspaceRoot);
    let dir = path.resolve(startDir);

    while (true) {
      for (const { file, packageManager } of LOCKFILE_PACKAGE_MANAGERS) {
        if (fs.existsSync(path.join(dir, file))) {
          return packageManager;
        }
      }
      if (dir === resolvedRoot || !dir.startsWith(resolvedRoot)) break;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    return 'npm';
  }

  /**
   * Find which package.json + npm script would start a given port, and which
   * package manager should run it. Returns null when nothing usable is found.
   */
  private async resolveStartTarget(port: number, workspaceRoot: string): Promise<StartTarget | null> {
    const configFiles = this.findProjectConfigFiles(workspaceRoot);
    const packageJsonFiles = configFiles.filter(f => path.basename(f).toLowerCase() === 'package.json');

    const portBoundary = new RegExp(`\\b${port}\\b`);
    let heuristicFallback: StartTarget | null = null;

    for (const pkgPath of packageJsonFiles) {
      let pkg: any;
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      } catch {
        continue;
      }

      const scripts: Record<string, string> = pkg.scripts || {};
      const folder = path.dirname(pkgPath);

      // 1. Prefer a script that literally references this port number
      for (const [name, command] of Object.entries(scripts)) {
        if (portBoundary.test(command)) {
          return { folder, script: name, packageManager: this.detectPackageManager(folder, workspaceRoot) };
        }
      }

      // 2. Fall back to a dependency's conventional default port (e.g. vite -> 5173)
      if (!heuristicFallback) {
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const matchedDep = Object.keys(DEV_DEPENDENCY_DEFAULT_PORTS).find(
          dep => allDeps[dep] && DEV_DEPENDENCY_DEFAULT_PORTS[dep] === port
        );

        if (matchedDep) {
          const scriptNames = Object.keys(scripts);
          const preferred = PREFERRED_SCRIPT_NAMES.find(name => scriptNames.includes(name));
          const mentionsTool = scriptNames.find(name => scripts[name].includes(matchedDep));
          const scriptName = preferred || mentionsTool || scriptNames[0];

          if (scriptName) {
            heuristicFallback = {
              folder,
              script: scriptName,
              packageManager: this.detectPackageManager(folder, workspaceRoot),
            };
          }
        }
      }
    }

    return heuristicFallback;
  }

  /**
   * Start whatever dev server is configured to run on the given port, using
   * the project's own package manager (npm / yarn / pnpm / bun).
   */
  public async startPort(port: number): Promise<{ success: boolean; message: string }> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return { success: false, message: 'No workspace folder is open.' };
    }

    const target = await this.resolveStartTarget(port, workspaceRoot);
    if (!target) {
      return {
        success: false,
        message: `Couldn't find a script that starts port ${port} — try running it manually.`,
      };
    }

    const { folder, script, packageManager } = target;
    const command = `${packageManager} run ${script}`;
    const relFolder = path.relative(workspaceRoot, folder) || '.';

    this.terminal = vscode.window.createTerminal({ name: `myaz: :${port}`, cwd: folder });
    this.terminal.sendText(command);
    this.terminal.show();

    return {
      success: true,
      message: `Running "${command}" in ${relFolder}`,
    };
  }

  /**
   * Lightweight check for whether something is now listening on a port —
   * used to poll after starting a dev server, without the cost of a full
   * enriched scan (cwd + full command lookups) on every attempt.
   */
  public async isPortListening(port: number): Promise<boolean> {
    const isWindows = process.platform === 'win32';

    try {
      if (isWindows) {
        const { stdout } = await execAsync('netstat -ano -p tcp');
        const portSuffix = new RegExp(`:${port}\\s`);
        return stdout.split('\r\n').some(line => line.includes('LISTENING') && portSuffix.test(line));
      }

      const { stdout } = await execAsync(`lsof -iTCP:${port} -sTCP:LISTEN -P -n`);
      return stdout.trim().split('\n').length > 1;
    } catch (err: any) {
      // lsof exits with code 1 (and no stdout) when nothing matches
      if (err?.stdout) {
        return err.stdout.trim().split('\n').length > 1;
      }
      return false;
    }
  }

  /**
   * Scan active listening ports on the operating system
   */
  public async scanPorts(customPort?: number): Promise<{ ports: PortProcessInfo[]; detectedProjectPorts: number[] }> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const detectedProjectPorts = await this.detectProjectPorts(workspaceRoot);
    const isWindows = process.platform === 'win32';

    try {
      if (isWindows) {
        const ports = await this.scanWindowsPorts(workspaceRoot, detectedProjectPorts, customPort);
        return { ports, detectedProjectPorts };
      } else {
        const ports = await this.scanUnixPorts(workspaceRoot, detectedProjectPorts, customPort);
        return { ports, detectedProjectPorts };
      }
    } catch (err) {
      console.error('Port scan failed:', err);
      return { ports: [], detectedProjectPorts };
    }
  }

  /**
   * Safe process termination (SIGTERM then SIGKILL or taskkill)
   */
  public async killProcess(pid: number): Promise<{ success: boolean; error?: string }> {
    if (pid <= 1) {
      return { success: false, error: 'Cannot terminate system core process PID 0 or 1' };
    }

    const isWindows = process.platform === 'win32';

    try {
      if (isWindows) {
        await execAsync(`taskkill /F /PID ${pid} /T`);
      } else {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          await execAsync(`kill -15 ${pid}`);
        }

        // Wait 250ms and force kill if still alive
        await new Promise(r => setTimeout(r, 250));
        try {
          process.kill(pid, 0); // Check if process is still alive
          // Still alive, force kill
          await execAsync(`kill -9 ${pid}`);
        } catch {
          // Process already terminated cleanly
        }
      }

      vscode.window.showInformationMessage(`Terminated process PID ${pid}`);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to kill PID ${pid}: ${msg}`);
      return { success: false, error: msg };
    }
  }

  // --- Unix (macOS / Linux) Port Scanner ---

  private async scanUnixPorts(
    workspaceRoot?: string,
    detectedProjectPorts: number[] = [],
    customPort?: number
  ): Promise<PortProcessInfo[]> {
    const cmd = customPort
      ? `lsof -iTCP:${customPort} -sTCP:LISTEN -P -n`
      : `lsof -iTCP -sTCP:LISTEN -P -n`;

    let stdout = '';
    try {
      const res = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 2 });
      stdout = res.stdout;
    } catch (err: any) {
      // Exit code 1 on lsof simply means no matching processes found
      if (err.stdout) stdout = err.stdout;
      else return [];
    }

    const lines = stdout.split('\n');
    const portMap = new Map<string, PortProcessInfo>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Columns: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;

      const command = parts[0];
      const pid = parseInt(parts[1], 10);
      const user = parts[2];
      const name = parts[parts.length - 2] || parts[parts.length - 1]; // e.g. *:3000, 127.0.0.1:5432, [::1]:8080

      const portMatch = name.match(/:(\d+)$/);
      if (!portMatch) continue;

      const port = parseInt(portMatch[1], 10);
      if (isNaN(port) || isNaN(pid)) continue;

      const key = `${port}-${pid}`;
      if (portMap.has(key)) continue;

      portMap.set(key, {
        port,
        pid,
        command,
        fullCommand: command,
        user,
        isCurrentProject: false,
      });
    }

    const items = Array.from(portMap.values());

    // Enrich processes with cwd and full command
    await Promise.all(
      items.map(async item => {
        try {
          // Get cwd
          const cwdRes = await execAsync(`lsof -a -p ${item.pid} -d cwd -Fn 2>/dev/null`);
          const cwdMatch = cwdRes.stdout.match(/^n(.+)$/m);
          if (cwdMatch) {
            item.cwd = cwdMatch[1].trim();
          }
        } catch {}

        try {
          // Get full command line
          const psRes = await execAsync(`ps -p ${item.pid} -o command= 2>/dev/null`);
          if (psRes.stdout.trim()) {
            item.fullCommand = psRes.stdout.trim();
          }
        } catch {}

        // Check if process belongs to current workspace or any microservice subfolder
        if (workspaceRoot && item.cwd) {
          const resolvedRoot = path.resolve(workspaceRoot);
          const resolvedCwd = path.resolve(item.cwd);
          if (resolvedCwd.startsWith(resolvedRoot)) {
            item.isCurrentProject = true;
            const rel = path.relative(resolvedRoot, resolvedCwd);
            item.relativeCwd = rel ? rel : '.';
          }
        }
      })
    );

    // Sort: Current Project processes first, then by port ascending
    return items.sort((a, b) => {
      if (a.isCurrentProject && !b.isCurrentProject) return -1;
      if (!a.isCurrentProject && b.isCurrentProject) return 1;
      return a.port - b.port;
    });
  }

  // --- Windows Port Scanner ---

  private async scanWindowsPorts(
    workspaceRoot?: string,
    detectedProjectPorts: number[] = [],
    customPort?: number
  ): Promise<PortProcessInfo[]> {
    let stdout = '';
    try {
      const res = await execAsync('netstat -ano -p tcp');
      stdout = res.stdout;
    } catch (err: any) {
      if (err.stdout) stdout = err.stdout;
      else return [];
    }

    const lines = stdout.split('\r\n');
    const portMap = new Map<string, PortProcessInfo>();

    for (const line of lines) {
      if (!line.includes('LISTENING')) continue;

      const parts = line.trim().split(/\s+/);
      // TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  12345
      if (parts.length < 5) continue;

      const localAddress = parts[1];
      const pidStr = parts[parts.length - 1];
      const pid = parseInt(pidStr, 10);

      const portMatch = localAddress.match(/:(\d+)$/);
      if (!portMatch) continue;

      const port = parseInt(portMatch[1], 10);
      if (isNaN(port) || isNaN(pid)) continue;

      if (customPort && port !== customPort) continue;

      const key = `${port}-${pid}`;
      if (portMap.has(key)) continue;

      portMap.set(key, {
        port,
        pid,
        command: 'process.exe',
        fullCommand: 'process.exe',
        isCurrentProject: detectedProjectPorts.includes(port),
      });
    }

    const items = Array.from(portMap.values());

    // Enrich process name on Windows via tasklist
    await Promise.all(
      items.map(async item => {
        try {
          const taskRes = await execAsync(`tasklist /fi "pid eq ${item.pid}" /fo csv /nh`);
          // "node.exe","12345","Console","1","50,000 K"
          const firstCol = taskRes.stdout.split(',')[0];
          if (firstCol) {
            item.command = firstCol.replace(/"/g, '').trim();
            item.fullCommand = item.command;
          }
        } catch {}
      })
    );

    return items.sort((a, b) => {
      if (a.isCurrentProject && !b.isCurrentProject) return -1;
      if (!a.isCurrentProject && b.isCurrentProject) return 1;
      return a.port - b.port;
    });
  }
}
