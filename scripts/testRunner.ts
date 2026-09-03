import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { ConverterService } from '../src/modules/converters/converterService';

if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}
if (typeof (globalThis as any).ImageData === 'undefined') {
  (globalThis as any).ImageData = class ImageData {};
}
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}

// Mock minimal vscode context
const mockContext = {} as any;
const service = new ConverterService(mockContext);

const SAMPLES_DIR = path.resolve(__dirname, '../sample-converter-files');

async function runTests() {
  console.log('🧪 Starting Coders Canvas Converter Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: PDF ➔ Markdown / Text Extractor
  console.log('--- TEST SUITE 1: PDF Extractor Engine ---');
  try {
    const pdfBuffer = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-document.pdf'));
    const pdfBase64 = pdfBuffer.toString('base64');

    // 1.1 Convert PDF to Markdown
    const mdResult = await service.convert({
      id: 'test-pdf-md',
      fileName: 'sample-document.pdf',
      sourceFormat: 'pdf',
      targetFormat: 'md',
      dataBase64: pdfBase64,
    });

    if (!mdResult.success) {
      console.log('    PDF ERROR MESSAGE:', mdResult.error);
    }
    assert(mdResult.success, 'PDF to Markdown conversion succeeded');
    assert(mdResult.fileName === 'sample-document.md', 'Output filename is sample-document.md');
    assert((mdResult.outputText || '').includes('Coders Canvas - Engineering Report'), 'Extracted heading correctly');
    assert((mdResult.outputText || '').includes('Pages: 2'), 'Extracted page count accurately (Pages: 2)');
    assert((mdResult.outputText || '').includes('Page 2: Performance Metrics & Benchmarks'), 'Extracted page 2 content');

    // 1.2 Convert PDF to Plain Text
    const txtResult = await service.convert({
      id: 'test-pdf-txt',
      fileName: 'sample-document.pdf',
      sourceFormat: 'pdf',
      targetFormat: 'txt',
      dataBase64: pdfBase64,
    });

    assert(txtResult.success, 'PDF to Plain Text conversion succeeded');
    assert((txtResult.outputText || '').length > 100, 'Plain text has substantial content');
  } catch (err) {
    console.error('  ❌ PDF Test Exception:', err);
    failed++;
  }

  // TEST 2: Markdown ➔ Interactive Slide Deck (HTML Presentation)
  console.log('\n--- TEST SUITE 2: Markdown to Interactive Slide Deck ---');
  try {
    const mdContent = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-presentation.md'), 'utf-8');

    // 2.1 Convert MD to Slide Deck
    const slideResult = await service.convert({
      id: 'test-slide-deck',
      fileName: 'sample-presentation.md',
      sourceFormat: 'md',
      targetFormat: 'slide-deck',
      textData: mdContent,
    });

    assert(slideResult.success, 'Markdown to Slide Deck conversion succeeded');
    assert(slideResult.fileName === 'sample-presentation.slides.html', 'Output filename is .slides.html');
    assert((slideResult.outputText || '').includes('class="slide active"'), 'Generates active slide section');
    assert((slideResult.outputText || '').includes('nextSlide()') && (slideResult.outputText || '').includes('prevSlide()'), 'Includes keyboard navigation handlers');
    assert((slideResult.outputText || '').includes('requestFullscreen()'), 'Includes native Fullscreen presentation API');
    assert((slideResult.outputText || '').includes('Slide 1 / 5'), 'Accurately partitioned 5 slide sections by --- dividers');

    // 2.2 Convert MD to PDF
    const pdfResult = await service.convert({
      id: 'test-md-pdf',
      fileName: 'sample-presentation.md',
      sourceFormat: 'md',
      targetFormat: 'pdf',
      textData: mdContent,
    });

    assert(pdfResult.success, 'Markdown to PDF conversion succeeded');
    assert(pdfResult.isBinary, 'PDF result is flagged as binary');
    assert((pdfResult.outputDataBase64 || '').length > 500, 'PDF binary data generated');

    // 2.3 Convert MD to Styled HTML
    const htmlResult = await service.convert({
      id: 'test-md-html',
      fileName: 'sample-presentation.md',
      sourceFormat: 'md',
      targetFormat: 'html',
      textData: mdContent,
    });

    assert(htmlResult.success, 'Markdown to HTML conversion succeeded');
    assert((htmlResult.outputText || '').includes('<!DOCTYPE html>'), 'Generated full HTML document');
  } catch (err) {
    console.error('  ❌ Slide Deck / Markdown Test Exception:', err);
    failed++;
  }

  // TEST 3: Spreadsheets ➔ JSON & Markdown Table
  console.log('\n--- TEST SUITE 3: Spreadsheet Conversion Engine ---');
  try {
    const xlsxBuffer = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-sheet.xlsx'));
    const xlsxBase64 = xlsxBuffer.toString('base64');

    // 3.1 XLSX to JSON
    const jsonResult = await service.convert({
      id: 'test-xlsx-json',
      fileName: 'sample-sheet.xlsx',
      sourceFormat: 'xlsx',
      targetFormat: 'json',
      dataBase64: xlsxBase64,
    });

    assert(jsonResult.success, 'XLSX to JSON conversion succeeded');
    const parsedRows = JSON.parse(jsonResult.outputText || '[]');
    assert(Array.isArray(parsedRows) && parsedRows.length === 5, 'Parsed 5 spreadsheet records correctly');
    assert(parsedRows[0].Feature === 'Batch Conversions', 'Column headers and cell values match');

    // 3.2 XLSX to Markdown Table
    const tableResult = await service.convert({
      id: 'test-xlsx-md',
      fileName: 'sample-sheet.xlsx',
      sourceFormat: 'xlsx',
      targetFormat: 'markdown-table',
      dataBase64: xlsxBase64,
    });

    assert(tableResult.success, 'XLSX to Markdown Table conversion succeeded');
    assert((tableResult.outputText || '').includes('| ID | Feature | Category |'), 'Markdown table headers generated');
    assert((tableResult.outputText || '').includes('| --- | --- | --- |'), 'Markdown table separator generated');

    // 3.3 CSV to JSON
    const csvContent = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-data.csv'), 'utf-8');
    const csvResult = await service.convert({
      id: 'test-csv-json',
      fileName: 'sample-data.csv',
      sourceFormat: 'csv',
      targetFormat: 'json',
      textData: csvContent,
    });

    assert(csvResult.success, 'CSV to JSON conversion succeeded');
    const parsedCsvRows = JSON.parse(csvResult.outputText || '[]');
    assert(parsedCsvRows.length === 5, 'CSV parsed 5 records');
  } catch (err) {
    console.error('  ❌ Spreadsheet Test Exception:', err);
    failed++;
  }

  // TEST 4: Data & Configuration Formats (JSON ↔ YAML ↔ XML ↔ ENV)
  console.log('\n--- TEST SUITE 4: Data & Schema Engine ---');
  try {
    const jsonContent = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-config.json'), 'utf-8');

    // 4.1 JSON to YAML
    const yamlResult = await service.convert({
      id: 'test-json-yaml',
      fileName: 'sample-config.json',
      sourceFormat: 'json',
      targetFormat: 'yaml',
      textData: jsonContent,
    });

    assert(yamlResult.success, 'JSON to YAML conversion succeeded');
    assert((yamlResult.outputText || '').includes('appName: Coders Canvas'), 'YAML formatted appName key');
    assert((yamlResult.outputText || '').includes('offlineMode: true'), 'YAML nested boolean key');

    // 4.2 JSON to XML
    const xmlResult = await service.convert({
      id: 'test-json-xml',
      fileName: 'sample-config.json',
      sourceFormat: 'json',
      targetFormat: 'xml',
      textData: jsonContent,
    });

    assert(xmlResult.success, 'JSON to XML conversion succeeded');
    assert((xmlResult.outputText || '').includes('<appName>Coders Canvas</appName>'), 'XML element generated');

    // 4.3 ENV to JSON
    const envContent = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-env.env'), 'utf-8');
    const envResult = await service.convert({
      id: 'test-env-json',
      fileName: 'sample-env.env',
      sourceFormat: 'env',
      targetFormat: 'json',
      textData: envContent,
    });

    assert(envResult.success, 'ENV to JSON conversion succeeded');
    const envObj = JSON.parse(envResult.outputText || '{}');
    assert(envObj.PORT === '3000' && envObj.NODE_ENV === 'production', 'ENV keys parsed into JSON correctly');
  } catch (err) {
    console.error('  ❌ Data & Schema Test Exception:', err);
    failed++;
  }

  // TEST 5: Batch ZIP Packaging & SVG Verification
  console.log('\n--- TEST SUITE 5: Batch Packaging & SVG Verification ---');
  try {
    const zip = new JSZip();
    zip.file('file1.webp', 'sample-webp-content');
    zip.file('file2.webp', 'sample-webp-content-2');
    zip.file('notes.md', '# Converted Markdown');

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    assert(zipBuffer.length > 100, 'JSZip generated valid zip archive buffer');

    // Verify SVG sample exists and has valid XML tags
    const svgContent = fs.readFileSync(path.join(SAMPLES_DIR, 'sample-logo.svg'), 'utf-8');
    assert(svgContent.includes('<svg') && svgContent.includes('</svg>'), 'sample-logo.svg is valid SVG document');
    assert(svgContent.includes('viewBox="0 0 512 512"'), 'SVG contains 512x512 vector coordinate system');
  } catch (err) {
    console.error('  ❌ Batch/SVG Test Exception:', err);
    failed++;
  }

  // SUMMARY REPORT
  console.log('\n========================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
