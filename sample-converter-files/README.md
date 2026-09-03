# 🧪 Coders Canvas - Converter Test Suite

This directory contains sample files to test all the features of the **Coders Canvas Universal Local Converter**.

---

### 1. 🎨 SVG ➔ Multi-Resolution PNG Bundle
- **File**: [`sample-logo.svg`](./sample-logo.svg)
- **How to test**:
  1. Drag and drop `sample-logo.svg` into the Converters dropzone.
  2. Select target: **`Multi-Res PNG Bundle (16px-512px)`**.
  3. Click **Convert Now**.
  4. Notice the 6 preview tiles generated (`16x16`, `32x32`, `64x64`, `128x128`, `256x256`, `512x512`).
  5. Click **Save** to export the entire suite as a `.zip` archive!

---

### 2. 📑 Markdown ➔ Interactive Slide Deck (HTML Presentation)
- **File**: [`sample-presentation.md`](./sample-presentation.md)
- **How to test**:
  1. Drop `sample-presentation.md` into the Converters dropzone.
  2. Select target: **`Interactive Slide Deck (.html)`**.
  3. Click **Convert Now**.
  4. Click **Save** (e.g. `sample-presentation.slides.html`).
  5. Open the HTML file in any web browser:
     - Use **Left/Right Arrow keys** or **Space** to navigate slides.
     - Press **F** to toggle native Fullscreen presentation mode.
     - Check the slide counter and progress bar at the top/bottom.

---

### 3. 📄 PDF ➔ Markdown / Text Extractor
- **File**: [`sample-document.pdf`](./sample-document.pdf)
- **How to test**:
  1. Drop `sample-document.pdf` into the Converters dropzone.
  2. Select target: **`Markdown (.md) - Text & Headings`**.
  3. Click **Convert Now**.
  4. View the live extracted markdown with total page count (`Pages: 2`) and structured text.
  5. Click **Copy** or **Save**.

---

### 4. ⚡ Batch & Multi-File Queue
- **Files**: Select all 3 image files together:
  - [`batch-avatar.png`](./batch-avatar.png)
  - [`batch-banner.png`](./batch-banner.png)
  - [`batch-thumbnail.png`](./batch-thumbnail.png)
- **How to test**:
  1. Highlight and drag all 3 files together into the dropzone.
  2. The UI switches to **Batch Queue Mode** displaying all 3 files.
  3. Choose target format: e.g. **`WebP (Compressed)`**.
  4. Click **`Convert All (3 files)`**.
  5. Watch real-time green checkmarks appear for each file.
  6. Click **`Export ZIP`** or **`Save All to Folder`**.

---

### 5. 🔄 In-Place File Replace Option
- **How to test**:
  1. Load any file (e.g. `sample-config.json`).
  2. Select target: **`YAML (.yaml)`**.
  3. Check the box: **`[x] Replace original file on disk`**.
  4. Click **Convert Now** and **Save**.
  5. The original file is removed and replaced by the newly converted `.yaml` file.

---

### 6. 📊 Spreadsheets ➔ JSON & Markdown Tables
- **Files**: [`sample-data.csv`](./sample-data.csv) or [`sample-sheet.xlsx`](./sample-sheet.xlsx)
- **How to test**:
  1. Drop `sample-data.csv` or `sample-sheet.xlsx`.
  2. Select target: **`Markdown Table (.md)`** or **`JSON Array (.json)`**.
  3. Click **Convert Now** to preview the formatted table/JSON.
