import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PortProcessInfo } from '../../common/types';

const execAsync = promisify(exec);

export class PortService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Automatically detect port numbers configured in this workspace's package.json or .env files
   */
  public async detectProjectPorts(workspaceRoot?: string): Promise<number[]> {
    const root = workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root || !fs.existsSync(root)) {
      return [3000, 5173, 8080];
    }

    const detected = new Set<number>();

    // 1. Check package.json scripts
    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg.scripts || {};
        const scriptText = JSON.stringify(scripts);

        const portMatches = scriptText.matchAll(/(?:--port|-p|PORT=)\s*(\d{2,5})/gi);
        for (const m of portMatches) {
          const p = parseInt(m[1], 10);
          if (p > 0 && p <= 65535) detected.add(p);
        }

        // Framework heuristic defaults
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps['next']) detected.add(3000);
        if (allDeps['vite']) detected.add(5173);
        if (allDeps['@angular/core']) detected.add(4200);
        if (allDeps['nuxt']) detected.add(3000);
        if (allDeps['gatsby']) detected.add(8000);
        if (allDeps['remix']) detected.add(3000);
      } catch (err) {
        console.error('Failed to parse package.json for ports:', err);
      }
    }

    // 2. Check .env files (.env, .env.local, .env.development)
    const envNames = ['.env', '.env.local', '.env.development', '.env.dev'];
    for (const envFile of envNames) {
      const fullPath = path.join(root, envFile);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (const line of lines) {
            const m = line.match(/^(?:PORT|VITE_PORT|APP_PORT|SERVER_PORT|DEV_PORT|API_PORT)\s*=\s*(\d{2,5})/i);
            if (m) {
              const p = parseInt(m[1], 10);
              if (p > 0 && p <= 65535) detected.add(p);
            }
          }
        } catch (err) {
          console.error(`Failed to parse ${envFile} for ports:`, err);
        }
      }
    }

    // Standard dev defaults if none found
    if (detected.size === 0) {
      detected.add(3000);
      detected.add(5173);
      detected.add(8080);
    }

    return Array.from(detected);
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

        // Check if process belongs to current workspace
        if (workspaceRoot && item.cwd) {
          const resolvedRoot = path.resolve(workspaceRoot);
          const resolvedCwd = path.resolve(item.cwd);
          if (resolvedCwd.startsWith(resolvedRoot)) {
            item.isCurrentProject = true;
          }
        }

        // Also if port is in detected project ports and command is node/python/bun/deno
        if (!item.isCurrentProject && detectedProjectPorts.includes(item.port)) {
          const devBinaries = ['node', 'npm', 'pnpm', 'yarn', 'bun', 'deno', 'python', 'ruby', 'go'];
          if (devBinaries.some(b => item.command.toLowerCase().includes(b))) {
            item.isCurrentProject = true;
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
