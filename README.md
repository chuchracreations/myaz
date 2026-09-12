<div align="center">

  <img src="https://res.cloudinary.com/dquzactsh/image/upload/v1789235525/logo_stxkje.png" alt="myaz Logo" width="220" style="max-width: 100%; height: auto;" />

### _The All-in-One Offline Developer Toolkit for VS Code_

**Snippets · File Converters · Port Killer · Dev Utilities · Fake Data Generator — in one sidebar, offline by default.**

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/himanshuchuchra.myaz-extension?style=for-the-badge&logo=visual-studio-code&label=Marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/himanshuchuchra.myaz-extension?style=for-the-badge&label=Installs&color=success)](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/himanshuchuchra.myaz-extension?style=for-the-badge&label=Rating&color=yellow)](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Offline First](https://img.shields.io/badge/Storage-100%25%20Offline%20%26%20Private-orange?style=for-the-badge)](#-100-offline-private--local)

  <p align="center">
    <b>Stop re-writing boilerplate, stop uploading sensitive files to random web converters, and stop Googling <code>kill port 3000</code> for the hundredth time.</b><br/>
    <sub>Five tools. One sidebar. Everything runs locally on your machine.</sub>
  </p>

<a href="vscode:extension/himanshuchuchra.myaz-extension"><b>➜ Install in VS Code</b></a>
&nbsp;|&nbsp;
<a href="https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension"><b>View on Marketplace</b></a>
&nbsp;|&nbsp;
<a href="https://chuchracreations.github.io/myaz/"><b>Website</b></a>
&nbsp;|&nbsp;
<a href="https://github.com/chuchracreations/myaz"><b>Star on GitHub ⭐</b></a>

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Explore All Modules](#-explore-all-modules)
- [Universal File Converters](#-universal-file-converters)
- [Smart Snippet Manager](#-smart-snippet-manager)
- [Port Janitor](#-port-janitor)
- [Developer Utilities](#-developer-utilities)
- [Random Data Generator](#-random-data-generator)
- [Workspace Portability](#-workspace-portability)
- [100% Offline, Private & Local](#-100-offline-private--local)
- [Command Palette Shortcuts](#-command-palette-shortcuts)
- [Technology Stack](#-technology-stack)
- [Contributing & Feedback](#-contributing--feedback)
- [Search Keywords](#-supported-use-cases--search-keywords)

---

## ✨ Overview

**myaz** is a high-performance, modular productivity suite built directly into your VS Code sidebar. Engineered with **React 18**, **TypeScript**, and a clean, modern UI, myaz replaces a whole tab-full of web tools with five offline modules:

|  #  | Module             | What it replaces                                      |
| :-: | :----------------- | :---------------------------------------------------- |
|  1  | ⚡ **Snippets**    | Your scattered `notes.txt` / Notion snippet dump      |
|  2  | 🔄 **Converters**  | Random online file-converter websites                 |
|  3  | 🛑 **Ports**       | `lsof -i :3000` + `kill -9` in the terminal           |
|  4  | 🧰 **Utilities**   | jwt.io, uuidgenerator.net, regex101, base64decode.org |
|  5  | 🎲 **Random Data** | Mockaroo / Faker.js scripts for quick test data       |

No accounts, no config files, no telemetry — install it and it's ready to use in seconds.

---

## 🧭 Quick Start

Getting productive with myaz takes three steps:

1. **Install** — search **`myaz`** in the VS Code Extensions view, or run:

   ```
   ext install himanshuchuchra.myaz-extension
   ```

   Paste that into Quick Open (`Cmd/Ctrl + P`) to jump straight to the install prompt.

2. **Open** — click the **myaz** icon (the blue-violet "M") in your Activity Bar.

3. **Pick a module** — Snippets, Converters, Ports, Utilities, or Random Data — and start working. Everything is local; there's nothing to sign in to.

---

## 🚀 Explore All Modules

<table>
<tr>
<td width="20%"><b>⚡ Snippets</b></td>
<td>Save, tag, search, and insert reusable code with live syntax highlighting and tab-stop support.</td>
</tr>
<tr>
<td><b>🔄 Converters</b></td>
<td>Batch-convert images, documents, spreadsheets, and data files — 100% offline.</td>
</tr>
<tr>
<td><b>🛑 Ports</b></td>
<td>Scan, inspect, and kill blocked dev ports (<code>EADDRINUSE</code>) in one click.</td>
</tr>
<tr>
<td><b>🧰 Utilities</b></td>
<td>7 everyday dev tools: JWT inspector, UUID generator, Base64, SHA-256, URL encoder, date/timezone, regex tester.</td>
</tr>
<tr>
<td><b>🎲 Random Data</b></td>
<td>14 fake-data generators for names, emails, addresses, passwords, and more — plus a batch mode.</td>
</tr>
</table>

---

## 🔄 Universal File Converters

Never upload confidential company code, spreadsheets, or documents to third-party web converters again. Convert files locally on your machine with instant speed and zero tracking.

#### ⚡ Conversion Capabilities Matrix

| Category                  | Input Formats                            | Available Output Formats                                                                                |
| :------------------------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Vector & Graphics**     | `.svg`                                   | **Multi-Res PNG Bundle (16px–512px ZIP)**, **PNG**, **WebP**, **Favicon (`.ico`)**, **Base64 Data URI** |
| **Raster Images**         | `.png`, `.jpg`, `.jpeg`, `.webp`         | **WebP (Compressed)**, **PNG (Lossless)**, **JPEG**, **Favicon (`.ico`)**, **Base64**                   |
| **Presentations**         | `.md`, `.markdown`                       | **Interactive Slide Deck (`.html`)**, **PDF Document**, **Styled HTML**, **Plain Text**                 |
| **PDF Extraction**        | `.pdf`                                   | **Markdown (`.md`) with Headings & Pages**, **Plain Text (`.txt`)**                                     |
| **Documents & Office**    | `.docx`, `.txt`, `.html`                 | **PDF Document**, **Markdown**, **HTML Web Page**, **Plain Text**                                       |
| **Spreadsheets & Tables** | `.xlsx`, `.xls`, `.csv`, `.tsv`          | **JSON Array**, **Markdown Table**, **HTML Table**, **CSV File**                                        |
| **Data & Config**         | `.json`, `.yaml`, `.yml`, `.xml`, `.env` | **JSON**, **YAML**, **XML**, **Environment (`.env`)**                                                   |

#### 🛠️ Developer Power Tools

- **⚡ Multi-File Batch Queue**: Drag & drop multiple files at once. Choose a global target (e.g. convert 10 PNGs to WebP in 1 click), monitor per-item progress, and **Save All to Folder** or **Export as ZIP Archive**.
- **🔄 In-Place File Replace**: Optional toggle `[x] Replace original file on disk` automatically swaps the original asset on disk with the new format.
- **🎨 SVG Multi-Resolution Icon Suite**: Render vector SVGs into a complete icon pack (`16×16`, `32×32`, `48×48`, `64×64`, `128×128`, `256×256`, `512×512`) packaged in a ready-to-use `.zip`.
- **📑 Markdown ➔ Interactive Slide Deck**: Convert any Markdown file with `---` slide dividers into a standalone, dark-themed HTML presentation deck with keyboard arrow navigation, slide counters, and native fullscreen (`F`).
- **📄 PDF ➔ Structured Markdown**: Extract headings, page counts, and formatted body text from `.pdf` documents using our built-in offline stream engine.
- **📂 Explorer Context Menu**: Right-click any file in your VS Code Explorer ➔ **`myaz: Convert File...`** to convert and save beside the original in one click.

---

## ⚡ Smart Snippet Manager

- **Live Search & Filtering**: Instant, real-time filtering across snippet titles, descriptions, code bodies, and tags.
- **Auto Language Detection**: Intelligently identifies your active editor's programming language and highlights matching snippets first.
- **Rich Color Syntax Highlighting**: Preview snippets with syntax highlighting tailored to TypeScript/TSX, JavaScript/JSX, Python, HTML/XML, CSS/SCSS, JSON/YAML, SQL, Bash, and Markdown.
- **Interactive Tab-Stops**: Full support for native VS Code snippet placeholders (`$1`, `${1:variableName}`, `$0`) styled with subtle visual indicators.
- **1-Click Selection Capture**: Highlight any code in your active editor ➔ right-click ➔ **`myaz: Save Selection as Snippet`**.
- **Instant Cursor Insertion**: Click **Insert** to inject code directly at your cursor position with tab-stop navigation between placeholders.
- **Favorites & Pinning**: Star your go-to snippets to keep them pinned at the top of your library.
- **Tag System**: Group snippets by stack or topic (`#react`, `#frontend`, `#api`, `#sql`, `#docker`).

---

## 🛑 Port Janitor

Never fight `Error: listen EADDRINUSE: address already in use :::3000` again. Clean up ghost dev servers and terminate blocked ports in 1 click without memorizing terminal commands.

- **📍 Monorepos & Microservices Aware**: Recursively detects processes across nested workspace folders (`apps/web`, `services/auth`, `packages/api`) and attributes each one to its subfolder.
- **👻 Ghost Process Highlighting**: Detects if a listening process was started inside your active workspace directory (`cwd`) and badges it with **`📍 THIS WORKSPACE`**.
- **⚡ 1-Click Safe Termination**: Kill a single process, or **Kill All** workspace ports at once — graceful `SIGTERM` → `SIGKILL` on Unix, `taskkill` on Windows.
- **🚀 Start on Port**: Relaunch a dev server directly on a chosen port from the same panel.
- **🔍 On-Demand Port Inspector**: Search bar to inspect and kill any specific port number (e.g. `3000`, `8080`) while filtering out unrelated system background processes.

---

## 🧰 Developer Utilities

Seven everyday tools that usually mean opening a new browser tab — now built in and fully offline:

| Tool                    | What it does                                       |
| :---------------------- | :------------------------------------------------- |
| 🔑 **JWT Inspector**    | Decode and verify JSON Web Tokens with live output |
| 🔢 **UUID Generator**   | Generate and copy a fresh UUID v4                  |
| 🔡 **Base64 Converter** | Encode / decode text strings instantly             |
| #️⃣ **SHA-256 Hasher**   | Generate a cryptographic checksum for any text     |
| 🌐 **URL Encoder**      | Encode / decode URI components                     |
| 🕒 **Date & Timezone**  | Convert dates and times across timezones           |
| 🔎 **Regex Tester**     | Test patterns with live match highlighting         |

---

## 🎲 Random Data Generator

Need realistic fake data for a demo, a seed script, or a UI mockup? Generate it locally — nothing is ever sent over the network.

- **Batch Generator**: Pick any combination of fields and generate many records at once, ready to copy or export.
- **14 Individual Generators**: Email Address, Phone Number (country-aware formatting), Full Name, Password, Street Address, Username, Company Name, Date of Birth, Job Title, IP Address, MAC Address, User Agent, Hex Color, Lorem Ipsum.
- **Safe by Design**: IPs use the RFC 5737 documentation range, MAC addresses are locally administered — nothing resembles real-world identifiers.

---

## 📦 Workspace Portability

- **Single-File Export**: Export your entire snippet library to a clean `myaz-workspace.json` file in one click.
- **Flexible Import Modes**:
  - **Merge with Existing**: Appends new snippets while preserving your current collection.
  - **Replace All**: Replaces your workspace with the imported pack.

---

## 🔒 100% Offline, Private & Local

- **Zero Telemetry**: All five core modules — Snippets, Converters, Ports, Utilities, and Random Data — make zero network requests, have zero tracking, and send zero data to external servers.
- **The one exception**: the optional **Feedback** button on the Home screen (_"Please provide me Feedback"_) loads a Google Form. It only makes a network request when you open it, and only sends data if you submit the form yourself — nothing runs automatically or in the background.
- **Local Storage**: All snippets are stored locally on your machine in human-readable JSON:

| Operating System | Default Storage Path                                                                                  |
| :--------------- | :---------------------------------------------------------------------------------------------------- |
| **macOS**        | `~/Library/Application Support/Code/User/globalStorage/himanshuchuchra.myaz-extension/workspace.json` |
| **Windows**      | `%APPDATA%\Code\User\globalStorage\himanshuchuchra.myaz-extension\workspace.json`                     |
| **Linux**        | `~/.config/Code/User/globalStorage/himanshuchuchra.myaz-extension/workspace.json`                     |

> 💡 **Pro Tip**: Any manual edits you save directly to `workspace.json` in VS Code are instantly reloaded by the extension!

---

## ⌨️ Command Palette Shortcuts

Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux) to access commands:

| Command                                             | Description                                                                  |
| :-------------------------------------------------- | :--------------------------------------------------------------------------- |
| **`myaz: Convert File...`**                         | Converts any right-clicked file in the explorer to PDF, Markdown, WebP, etc. |
| **`myaz: Scan & Kill Locked Ports (Port Janitor)`** | Scans dev ports, detects ghost servers, and frees locked ports               |
| **`myaz: Save Selection as Snippet`**               | Creates a new snippet from your current editor selection                     |
| **`myaz: Insert Snippet`**                          | Inserts a selected snippet directly into your active document                |
| **`myaz: Open Workspace Data File`**                | Opens your local `workspace.json` data file on disk in VS Code               |
| **`myaz: Export Workspace Data`**                   | Exports all workspace data to a standalone JSON file                         |
| **`myaz: Import Workspace Data`**                   | Imports workspace snippets from a JSON file (Merge or Replace)               |
| **`myaz: Refresh View`**                            | Syncs the sidebar with disk storage                                          |

---

## 🛠️ Technology Stack

- **Extension Host**: TypeScript + Node.js (VS Code Extension API)
- **Webview Architecture**: React 18 + TypeScript + Lucide Icons
- **Document Engines**: `mammoth` (Word), `jspdf` (PDF generation), `marked` (Markdown), `xlsx` (SheetJS), `js-yaml`, `fast-xml-parser`, `jszip`
- **Syntax Highlighting**: Prism.js syntax engine with language grammars
- **Bundler**: `esbuild` dual-pipeline (Node CJS for extension host, Browser ESM for webview)

---

## 🤝 Contributing & Feedback

- **In-editor Feedback**: Click **Please provide me Feedback** on the Home screen to share thoughts without leaving VS Code.
- **Report Issues & Feature Requests**: Reach out or file an issue on [GitHub](https://github.com/chuchracreations/myaz).
- **Enjoying myaz?**: Please consider leaving a ⭐ review on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=himanshuchuchra.myaz-extension)!

---

## 🔍 Supported Use Cases & Search Keywords

Looking for specific tools? **myaz** provides a 100% local, offline solution:

- **Document & PDF Tools**: `word to pdf`, `docx to pdf converter`, `markdown to pdf`, `markdown to html slides`, `pdf text extractor`, `extract tables from pdf`, `txt to pdf`.
- **Image & Web Graphics**: `svg to png converter`, `multi-resolution icon generator`, `favicon ico generator`, `png to webp`, `jpg to webp converter`, `image compressor`, `base64 data uri generator`.
- **Data & Configuration**: `excel to json converter`, `csv to json`, `xlsx to markdown table`, `json to yaml`, `yaml to json converter`, `xml to json`, `env to json`.
- **Port & Process Management**: `kill port`, `port killer`, `kill-port`, `eaddrinuse`, `address already in use`, `free port 3000`, `kill zombie process`, `find process by port`, `monorepo port manager`, `microservice port scanner`, `lsof port killer`, `terminate node process`.
- **Snippet Management**: `vs code snippet manager`, `code snippet organizer`, `interactive snippets`, `tab-stops snippet placeholders`, `insert snippet at cursor`, `snippet search`.
- **Dev Utilities**: `jwt decoder`, `jwt inspector`, `uuid generator`, `base64 encode decode`, `sha256 hash generator`, `url encoder decoder`, `regex tester`, `timezone converter`.
- **Fake / Test Data**: `fake data generator`, `random data generator`, `mock data generator`, `faker alternative`, `random email generator`, `random address generator`, `random password generator`.

---

<div align="center">

Crafted with care for developers who value speed, craft, and great tooling.

[chuchracreations.github.io/myaz](https://chuchracreations.github.io/myaz/) · **myaz** © 2026

</div>
