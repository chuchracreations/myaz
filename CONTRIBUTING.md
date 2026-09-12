# Contributing to myaz

Thanks for your interest in improving myaz! This guide covers how to get the project running locally, how it's organized, and what to check before opening a PR.

## Getting started

```bash
git clone https://github.com/himanshuchuchra/myaz-extension.git
cd myaz-extension
npm install
npm run watch
```

Then press `F5` in VS Code (or **Run and Debug → Run Extension**) to launch an Extension Development Host with myaz loaded. The `watch` task rebuilds automatically on save — reload the dev host window (`Cmd/Ctrl+R`) to pick up changes.

## Project layout

myaz has two build targets that share types but compile separately:

```
src/                    Extension host (Node.js, runs in VS Code's process)
  common/               Shared types used by both the host and the webview
  modules/<feature>/    One folder per feature (converters, ports, snippets)
    *Service.ts         Business logic (file I/O, process management, storage)
    *Commands.ts        VS Code command palette command registration
  providers/            Webview view provider — hosts the React app, routes
                         messages between the extension host and the webview

webview-ui/             The sidebar UI (React 18 + TypeScript, bundled separately)
  src/modules/<feature>/  One folder per feature, mirroring src/modules where
                          the feature has host-side logic. Utilities and
                          Random Data are pure client-side and have no
                          host-side counterpart — they don't touch the
                          filesystem or OS, so everything lives in the webview.
  src/components/       Shared, reusable UI components
  src/utils/             Shared client-side helpers
```

Communication between the two sides happens over `postMessage` — message shapes are defined as discriminated unions in [`src/common/types.ts`](src/common/types.ts) (`WebviewToHostMessage` / `HostToWebviewMessage`). All webview-originated messages are routed through one switch statement in [`SidebarWebviewProvider.ts`](src/providers/SidebarWebviewProvider.ts).

When adding a new command that should appear in the Command Palette, add it in a `*Commands.ts` file for its module (see `snippetCommands.ts` / `converterCommands.ts` / `portCommands.ts` for the pattern) and register it in [`src/extension.ts`](src/extension.ts).

## Before opening a PR

```bash
npm run typecheck   # Type-checks both the extension host and the webview
npm run build        # Production build via esbuild
```

There's currently no automated test suite — if you're touching converter or port logic, please describe how you manually verified the change (input file, expected output, OS tested on) in your PR description.

## Commit style

Recent history favors [Conventional Commits](https://www.conventionalcommits.org/)-style prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) — not strictly enforced, but appreciated for a readable history.

## Reporting issues

Please include your VS Code version, OS, and myaz version, plus steps to reproduce. For the Port Janitor and Converters modules, the exact command/file that triggered the issue is especially helpful.
