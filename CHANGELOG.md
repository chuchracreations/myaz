# Changelog

All notable changes to the **myaz** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Developer Utilities** module: JWT Inspector, UUID Generator, Base64 Converter, SHA-256 Hasher, URL Encoder, Date & Timezone converter, and Regex Tester.
- **Random Data** module: 14 individual fake-data generators (email, phone, name, password, address, username, company, date of birth, job title, IP, MAC, user agent, hex color, lorem ipsum) plus a batch generator.
- New Home screen with quick navigation between all modules.
- "Start on Port" and "Kill All" actions in the Ports module.

### Changed

- Rebranded the extension from _Coders Canvas_ to **myaz**, including a new logo and activity bar icon.
- Refined the Converters UI with clearer per-format conversion targets and improved file handling.
- Snippet cards now show language-based accent colors and support live search.

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
