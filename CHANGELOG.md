# Changelog

All notable changes to the **myaz** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.6.0] - 2026-09-14

### Added

- **Vim Guide**: a new top-level module — a searchable, categorized cheat sheet for 128 Vim commands across 13 groups (modes, movement, editing, registers, search, visual mode, marks, windows/buffers, macros, formatting, file ops). Click any command to copy it.
- **Git Cheat Sheet**: a new top-level module — a searchable reference for 74 everyday git commands across 10 categories (staging, branching, rebasing, remotes, stashing, tags, and more). Click any command to copy it.
- **JSON Formatter**: a new top-level module — format, minify, and validate JSON with line/column error reporting, and explore it as a collapsible tree with live stats (key count, depth, size) and expand/collapse-all controls.
- **Utilities**: a Cron Builder tool — build a cron expression via synced fields, see a plain-English explanation, preview upcoming run times, and pick from common presets.
- **Utilities**: a Case Converter tool — converts input into 11 case styles at once (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and more), each individually copyable.
- **Random Data**: a top search bar to filter the growing list of individual generators by name or description.
- **Random Data / Batch Generator**: an "Include country code" checkbox for the Phone generator, so numbers can be produced with or without the dial prefix.
- **Random Data**: 6 new individual generators — Image (via picsum.photos), UUID, Credit Card Number (Luhn-valid test numbers), URL, Timestamp, and Latitude/Longitude — bringing the module to 20 generators.
- **Random Data**: a Date format picker (multiple formats, mirroring the existing Phone country picker).
- **Batch Generator**: custom fields — add your own key name and pick a data type from a dropdown, included alongside the standard fields when generating.

### Fixed

- **Snippets**: the built-in "Welcome to myaz" snippet no longer reappears after being deleted — it's now seeded once on first run and behaves like any other snippet from then on.
- **Landing page**: the header tab-strip no longer shows a visible scrollbar with arrow buttons on Windows.

### Changed

- Reworded the Random Data "100% local" claim: the new Image generator loads a placeholder photo from picsum.photos, the one network exception in that module.

## [0.5.0] - 2026-09-13

### Added

- **In-editor Feedback**: a "Please provide me Feedback" button on the Home screen opens an embedded Google Form directly in the sidebar — no browser redirect required.

### Changed

- Reworded the "Zero Telemetry" / offline claims in the README and landing page to scope them to the five core modules, since the new optional Feedback form is the one screen that talks to the network (only when opened).

## [0.4.0] - 2026-09-12

### Added

- **Developer Utilities** module: JWT Inspector, UUID Generator, Base64 Converter, SHA-256 Hasher, URL Encoder, Date & Timezone converter, and Regex Tester.
- **Random Data** module: 14 individual fake-data generators (email, phone, name, password, address, username, company, date of birth, job title, IP, MAC, user agent, hex color, lorem ipsum) plus a batch generator.
- New Home screen with quick navigation between all modules.
- "Start on Port" and "Kill All" actions in the Ports module.

### Changed

- Rebranded the extension from _Coders Canvas_ to **myaz**, including a new logo and activity bar icon.
- Refined the Converters UI with clearer per-format conversion targets and improved file handling.
- Snippet cards now show language-based accent colors and support live search.
- Redesigned the Home screen footer with the myaz logo mark and wordmark, removing the old greeting text and "100% Offline" badge.

## [0.3.0] - 2026-09-04

### Added

- **Port Janitor**: project-aware port scanning and killing, with recursive `.env` and monorepo/microservice awareness.

### Changed

- Removed hardcoded fallback ports — port data is now always read live from the system.
- Streamlined the Ports view to focus on workspace processes and custom port inspection.
- Expanded marketplace SEO keywords for converters, port killer, and snippets.

## [0.2.0] - 2026-09-03

### Added

- **Universal Converters** module: fully offline conversion for documents, images, spreadsheets, and data formats.
- Batch multi-file conversion queue with in-place file replace.
- SVG multi-resolution icon bundle export (16px–512px ZIP).
- Markdown → interactive slide deck export.
- PDF text/heading extraction.

### Changed

- Comprehensive README rewrite documenting the converter suite.

## [0.1.1] - 2026-09-03

### Fixed

- Aligned the published package name with the Marketplace extension ID.

### Changed

- Moved snippet action buttons into the native VS Code view-title bar for a cleaner layout.

## [0.1.0] - 2026-09-03

### Added

- Initial release: Smart Snippet Manager with syntax highlighting, tagging, and workspace data export/import.
