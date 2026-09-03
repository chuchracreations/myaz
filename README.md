# Coders Canvas

A modern, modular productivity extension for Visual Studio Code, starting with a rich **Snippets** manager and engineered to easily scale into additional modules (e.g. AI Prompts, Templates, Project Notes).

## 🚀 Features (Snippets MVP)

- **Sidebar Integration**: Appears in the VS Code Activity Bar with a custom **octopus icon**. Clicking it opens **Coders Canvas** in the Primary Sidebar.
- **Premium Branding**: Clean, modern aesthetic with *Coders Canvas* branding and matching octopus logo.
- **Bricolage Grotesque Typography**: Styled with Google Font *Bricolage Grotesque* and VS Code native theme CSS tokens.
- **Language-Based Color Syntax Highlighting**: Snippets display rich, vibrant syntax coloring based on their selected language (TypeScript, TSX, JavaScript, Python, CSS, HTML, JSON, SQL, Bash, Markdown, etc.) powered by Prism.js, plus custom highlighting for tab-stops (`$1`, `$0`).
- **Modular Shell**: Designed from Day 1 to host multiple modules with a unified navigation bar.
- **Rich Snippets Management**:
  - **Search & Live Filter**: Search by title, code content, tags, or prefix.
  - **Automatic Language Detection**: Highlights snippets matching your active editor's file language.
  - **Insert at Cursor**: Direct insertion into active editor with tab-stop navigation (`$1`, `${1:label}`, `$0`).
  - **One-Click Copy**: Instant clipboard copy with visual confirmation.
  - **Save from Editor Selection**: Select code in any editor, right-click, and choose **Coders Canvas: Save Selection as Snippet**.
  - **Export Workspace Data**: One-click export of your entire extension data to a single `coders-canvas-workspace.json` file.
  - **Import Workspace Data**: Easily import data from any JSON file with *Merge with Existing* or *Replace All* options.
  - **Open Workspace on Device**: Dedicated button to open and edit the raw `workspace.json` data file directly in VS Code.
  - **Favorites & Tags**: Pin frequent snippets and organize with tags.

## 💾 Where Data is Stored on Your Device

All your data is saved locally on your device in a human-readable JSON file:

- **macOS**: `~/Library/Application Support/Code/User/globalStorage/himanshuchuchra.coders-canvas/workspace.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\himanshuchuchra.coders-canvas\workspace.json`
- **Linux**: `~/.config/Code/User/globalStorage/himanshuchuchra.coders-canvas/workspace.json`

> **Tip**: You can open this file anytime by clicking the **Folder icon** in the **Coders Canvas** header or running the command **Coders Canvas: Open Workspace Data File**. Any manual edits saved to `workspace.json` are automatically loaded by the extension!

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
4. Click the **myaz** icon in the Activity Bar (left sidebar) to test the extension!
