# MyAz VS Code Extension

A modern, modular productivity extension for Visual Studio Code, starting with a rich **Snippets** manager and engineered to easily scale into additional modules (e.g. AI Prompts, Templates, Project Notes).

## 🚀 Features (Snippets MVP)

- **Primary Sidebar Integration**: Appears in the VS Code Activity Bar with a custom icon. Clicking it opens the MyAz panel in the Primary Sidebar.
- **Bricolage Grotesque Typography**: Styled with Google Font *Bricolage Grotesque* and VS Code native theme CSS tokens.
- **Modular Shell**: Designed from Day 1 to host multiple modules with a unified navigation bar.
- **Rich Snippets Management**:
  - **Search & Live Filter**: Search by title, code content, tags, or prefix.
  - **Automatic Language Detection**: Highlights snippets matching your active editor's file language.
  - **Insert at Cursor**: Direct insertion into active editor with tab-stop navigation (`$1`, `${1:label}`, `$0`).
  - **One-Click Copy**: Instant clipboard copy with visual confirmation.
  - **Save from Editor Selection**: Select code in any editor, right-click, and choose **MyAz: Save Selection as Snippet**.
  - **Persistent Storage**: Uses `vscode.ExtensionContext.globalState` with pre-seeded example snippets.
  - **Favorites & Tags**: Pin frequent snippets and organize with tags.

## 🛠️ Tech Stack

- **Extension Host**: TypeScript + Node.js (`vscode` API)
- **Webview UI**: React 18 + TypeScript + Lucide Icons
- **Bundler**: `esbuild` (dual-target: Node CJS for host, Browser ESM for webview)
- **Design & Typography**: CSS with *Bricolage Grotesque* & *JetBrains Mono* + native VS Code theme tokens

## 📂 Architecture

```
myaz-extension/
├── .vscode/
│   ├── launch.json              # F5 debug configuration
│   └── tasks.json               # esbuild build and watch tasks
├── media/
│   └── icon.svg                 # Activity Bar icon
├── src/
│   ├── extension.ts             # Extension activation & registration
│   ├── common/
│   │   └── types.ts             # Shared message contracts & models
│   ├── modules/
│   │   └── snippets/
│   │       ├── snippetService.ts # globalState CRUD & seed data
│   │       └── snippetCommands.ts # Editor insertion & selection capture
│   └── providers/
│       └── SidebarWebviewProvider.ts # WebviewViewProvider + message bridge
├── webview-ui/
│   └── src/
│       ├── index.tsx            # React 18 entrypoint
│       ├── index.css            # Styling + Bricolage Grotesque
│       ├── vscodeApi.ts         # Type-safe acquireVsCodeApi() wrapper
│       ├── App.tsx              # Modular UI shell
│       └── modules/
│           └── snippets/
│               ├── SnippetList.tsx  # Search & filters
│               ├── SnippetCard.tsx  # Interactive snippet card
│               └── SnippetModal.tsx # Add/Edit modal dialog
├── build.mjs                    # Dual-target esbuild pipeline
└── package.json
```

## 💻 Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Bundles
```bash
npm run build
```

Or run incremental watch mode:
```bash
npm run watch
```

### 3. Run & Debug in VS Code
1. Open this repository in VS Code.
2. Press `F5` (or go to **Run and Debug** -> **Run Extension**).
3. A new **Extension Development Host** window will open.
4. Click the **MyAz** icon in the Activity Bar (left sidebar) to test the extension!
