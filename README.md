<div align="center">

  <img src="https://raw.githubusercontent.com/himanshuchuchra/coders-canvas/main/media/logo.png" alt="Coders Canvas Logo" width="300" style="max-width: 100%; height: auto;" />

  # Coders Canvas

  ### *The All-in-One Snippet Command Center, Universal Offline File Converter & Port Killer for VS Code*

  [![Visual Studio Marketplace Version](https://img.shields.io/badge/Marketplace-v0.3.0-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Offline First](https://img.shields.io/badge/Storage-100%25%20Offline%20%26%20Private-orange?style=for-the-badge)](#-100-offline-private--local)
  [![Stack](https://img.shields.io/badge/Built%20With-React%2018%20%7C%20TypeScript-61dafb?style=for-the-badge&logo=react)](#-technology-stack)

  <p align="center">
    <b>Stop re-writing boilerplate and stop uploading sensitive project files to online converter sites. Organize code snippets and transform files locally, securely, and with zero context switching.</b>
  </p>

</div>

---

## ✨ Overview

**Coders Canvas** is a high-performance, modular productivity suite built directly into your VS Code sidebar. Engineered with **React 18**, **TypeScript**, and modern flat outline aesthetics, Coders Canvas combines three developer essentials into one unified extension:

1. **⚡ Smart Snippets Command Center**: Real-time syntax-highlighted code manager with language auto-detection, tag filtering, editor selection capture, and tab-stop cursor insertion.
2. **🔄 Universal Local Converters Hub**: 100% offline file transformer supporting batch conversions, multi-resolution SVG icon bundles, interactive slide decks, and PDF text extraction.
3. **🛑 Port Janitor & Zombie Process Killer**: Project-aware port manager that eliminates `EADDRINUSE` errors and terminates ghost dev servers with 1 click.

---

## 🚀 Key Features

---

### 1. 🔄 Universal Local Converters (100% Offline & Private)

Never upload confidential company code, spreadsheets, or documents to third-party web converters again. Convert files locally on your machine with instant speed and zero tracking.

#### ⚡ Conversion Capabilities Matrix

| Category | Input Formats | Available Output Formats |
| :--- | :--- | :--- |
| **Vector & Graphics** | `.svg` | **Multi-Res PNG Bundle (16px–512px ZIP)**, **PNG**, **WebP**, **Favicon (`.ico`)**, **Base64 Data URI** |
| **Raster Images** | `.png`, `.jpg`, `.jpeg`, `.webp` | **WebP (Compressed)**, **PNG (Lossless)**, **JPEG**, **Favicon (`.ico`)**, **Base64** |
| **Presentations** | `.md`, `.markdown` | **Interactive Slide Deck (`.html`)**, **PDF Document**, **Styled HTML**, **Plain Text** |
| **PDF Extraction** | `.pdf` | **Markdown (`.md`) with Headings & Pages**, **Plain Text (`.txt`)** |
| **Documents & Office** | `.docx`, `.txt`, `.html` | **PDF Document**, **Markdown**, **HTML Web Page**, **Plain Text** |
| **Spreadsheets & Tables**| `.xlsx`, `.xls`, `.csv`, `.tsv` | **JSON Array**, **Markdown Table**, **HTML Table**, **CSV File** |
| **Data & Config** | `.json`, `.yaml`, `.yml`, `.xml`, `.env` | **JSON**, **YAML**, **XML**, **Environment (`.env`)** |

#### 🛠️ Developer Power Tools:
* **⚡ Multi-File Batch Queue**: Drag & drop multiple files at once. Choose a global target (e.g. convert 10 PNGs to WebP in 1 click), monitor per-item progress, and **Save All to Folder** or **Export as ZIP Archive**.
* **🔄 In-Place File Replace**: Optional toggle `[x] Replace original file on disk` automatically swaps the original asset on disk with the new format.
* **🎨 SVG Multi-Resolution Icon Suite**: Render vector SVGs into a complete icon pack (`16×16`, `32×32`, `48×48`, `64×64`, `128×128`, `256×256`, `512×512`) packaged in a ready-to-use `.zip`.
* **📑 Markdown ➔ Interactive Slide Deck**: Convert any Markdown file with `---` slide dividers into a standalone, dark-themed HTML presentation deck with keyboard arrow navigation, slide counters, and native fullscreen (`F`).
* **📄 PDF ➔ Structured Markdown**: Extract headings, page counts, and formatted body text from `.pdf` documents using our built-in offline stream engine.
* **📂 Explorer Context Menu**: Right-click any file in your VS Code Explorer ➔ **`Coders Canvas: Convert File...`** to convert and save beside the original in one click.

---

### 2. ⚡ Smart Snippet Command Center

* **Live Search & Filtering**: Instant, real-time filtering across snippet titles, descriptions, code bodies, and tags.
* **Auto Language Detection**: Intelligently identifies your active editor's programming language and highlights matching snippets first.
* **Rich Color Syntax Highlighting**: Preview snippets with VS Code Dark+ syntax highlighting tailored to:
  * TypeScript & TSX
  * JavaScript & JSX
  * Python
  * HTML / XML
  * CSS / SCSS
  * JSON / YAML
  * SQL
  * Bash / Shell
  * Markdown
* **Interactive Tab-Stops**: Full support for native VS Code snippet placeholders (`$1`, `${1:variableName}`, `$0`) styled with subtle visual indicators.
* **1-Click Selection Capture**: Highlight any code in your active editor ➔ right-click ➔ **`Coders Canvas: Save Selection as Snippet`**.
* **Instant Cursor Insertion**: Click **Insert** to inject code directly at your cursor position with tab-stop navigation between placeholders.
* **Favorites & Pinning**: Star your go-to snippets to keep them pinned at the top of your library.
* **Tag System**: Group snippets by stack or topic (`#react`, `#frontend`, `#api`, `#sql`, `#docker`).

---

### 3. 🛑 Port Janitor & Zombie Process Killer

Never fight `Error: listen EADDRINUSE: address already in use :::3000` again. Clean up ghost dev servers and terminate blocked ports in 1 click without memorizing terminal commands.

* **📍 Monorepos & Microservices Aware**:
  * Recursively scans nested `.env*` files, `package.json` scripts, and `docker-compose*.yml` across microservice folders (`apps/web`, `services/auth`, `packages/api`) in under 2ms.
  * Attributes active processes to their specific microservice subfolder (`📁 apps/web`, `📁 services/auth`).
* **👻 Ghost Process Highlighting**: Detects if a listening process was started inside your active workspace directory (`cwd`) and badges it with **`📍 THIS WORKSPACE`**.
* **⚡ 1-Click Safe Process Termination**: Terminate runaway Node, Vite, Python, or Next.js processes with graceful `SIGTERM` followed by `SIGKILL` on Unix, or `taskkill` on Windows.
* **🔍 On-Demand Port Inspector**: Search bar to inspect and kill any specific port number (e.g. `3000`, `8080`) while filtering out unrelated system background processes.

---

### 4. 📦 Complete Workspace Portability (Backup & Share)

* **Single-File Export**: Export your entire snippet library to a clean `coders-canvas-workspace.json` file in one click.
* **Flexible Import Modes**:
  * **Merge with Existing**: Appends new snippets while preserving your current collection.
  * **Replace All**: Replaces your workspace with the imported pack.

---

## 🔒 100% Offline, Private & Local

* **Zero Telemetry**: Coders Canvas makes zero network requests, has zero tracking, and sends zero data to external servers.
* **Local Storage**: All snippets are stored locally on your machine in human-readable JSON:

| Operating System | Default Storage Path |
| :--- | :--- |
| **macOS** | `~/Library/Application Support/Code/User/globalStorage/himanshuchuchra.coders-canvas/workspace.json` |
| **Windows** | `%APPDATA%\Code\User\globalStorage\himanshuchuchra.coders-canvas\workspace.json` |
| **Linux** | `~/.config/Code/User/globalStorage/himanshuchuchra.coders-canvas/workspace.json` |

> 💡 **Pro Tip**: Any manual edits you save directly to `workspace.json` in VS Code are instantly reloaded by the extension!

---

## ⌨️ Command Palette Shortcuts

Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux) to access commands:

| Command | Description |
| :--- | :--- |
| **`Coders Canvas: Convert File...`** | Converts any right-clicked file in the explorer to PDF, Markdown, WebP, etc. |
| **`Coders Canvas: Scan & Kill Locked Ports (Port Janitor)`** | Scans dev ports, detects ghost servers, and frees locked ports |
| **`Coders Canvas: Save Selection as Snippet`** | Creates a new snippet from your current editor selection |
| **`Coders Canvas: Insert Snippet`** | Inserts a selected snippet directly into your active document |
| **`Coders Canvas: Open Workspace Data File`** | Opens your local `workspace.json` data file on disk in VS Code |
| **`Coders Canvas: Export Workspace Data`** | Exports all workspace data to a standalone JSON file |
| **`Coders Canvas: Import Workspace Data`** | Imports workspace snippets from a JSON file (Merge or Replace) |
| **`Coders Canvas: Refresh View`** | Syncs the sidebar with disk storage |

---

## 🛠️ Technology Stack

* **Extension Host**: TypeScript + Node.js (VS Code Extension API)
* **Webview Architecture**: React 18 + TypeScript + Lucide Icons
* **Document Engines**: `mammoth` (Word), `jspdf` (PDF generation), `marked` (Markdown), `xlsx` (SheetJS), `js-yaml`, `fast-xml-parser`, `jszip`
* **Syntax Highlighting**: Prism.js syntax engine with language grammars
* **Bundler**: `esbuild` dual-pipeline (Node CJS for extension host, Browser ESM for webview)

---

## 🤝 Contributing & Feedback

* **Report Issues & Feature Requests**: Reach out or file an issue on [GitHub](https://github.com/himanshuchuchra/coders-canvas).
* **Enjoying Coders Canvas?**: Please consider leaving a ⭐ review on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension)!

---

## 🔍 Supported Use Cases & Search Keywords

Looking for specific tools? **Coders Canvas** provides a 100% local, offline solution:

* **Document & PDF Tools**: `word to pdf`, `docx to pdf converter`, `markdown to pdf`, `markdown to html slides`, `pdf text extractor`, `extract tables from pdf`, `txt to pdf`.
* **Image & Web Graphics**: `svg to png converter`, `multi-resolution icon generator`, `favicon ico generator`, `png to webp`, `jpg to webp converter`, `image compressor`, `base64 data uri generator`.
* **Data & Configuration**: `excel to json converter`, `csv to json`, `xlsx to markdown table`, `json to yaml`, `yaml to json converter`, `xml to json`, `env to json`.
* **Port & Process Management**: `kill port`, `port killer`, `kill-port`, `eaddrinuse`, `address already in use`, `free port 3000`, `kill zombie process`, `find process by port`, `monorepo port manager`, `microservice port scanner`, `lsof port killer`, `terminate node process`.
* **Snippet Management**: `vs code snippet manager`, `code snippet organizer`, `interactive snippets`, `tab-stops snippet placeholders`, `insert snippet at cursor`, `snippet search`.

---

<div align="center">

  Crafted with care for developers who value speed, craft, and great tooling.

  **Coders Canvas** © 2026

</div>
