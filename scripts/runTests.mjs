import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const mockVscodePlugin = {
  name: 'mock-vscode',
  setup(build) {
    build.onResolve({ filter: /^vscode$/ }, () => ({
      path: 'vscode',
      namespace: 'mock-vscode-ns',
    }));
    build.onLoad({ filter: /.*/, namespace: 'mock-vscode-ns' }, () => ({
      contents: `
        module.exports = {
          window: {
            showInformationMessage: () => Promise.resolve(),
            showSaveDialog: () => Promise.resolve(),
            showOpenDialog: () => Promise.resolve(),
          },
          workspace: {
            workspaceFolders: [{ uri: { fsPath: process.cwd() } }],
          },
          Uri: {
            file: (p) => ({ fsPath: p }),
            joinPath: (u, ...p) => ({ fsPath: require('path').join(u.fsPath, ...p) }),
          },
          commands: { executeCommand: () => Promise.resolve() }
        };
      `,
      loader: 'js',
    }));
  },
};

async function main() {
  const outfile = path.resolve('dist/test-runner.cjs');

  await esbuild.build({
    entryPoints: ['scripts/testRunner.ts'],
    bundle: true,
    outfile,
    plugins: [mockVscodePlugin],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    logLevel: 'error',
  });

  try {
    execSync(`node ${outfile}`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(outfile)) {
      fs.unlinkSync(outfile);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
