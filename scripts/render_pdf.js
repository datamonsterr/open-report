#!/usr/bin/env node

// render_pdf.js — Render HTML report to PDF with A4 portrait + landscape for wide diagrams
//
// Usage:
//   node scripts/render_pdf.js <input.html> [output.pdf] [--chromium PATH]
//
// Behavior:
//   - Default: A4 portrait, diagrams auto-landscape
//   - --landscape: A4 landscape for all pages
//   - --no-landscape: A4 portrait only (diagrams scaled to fit)

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ─── Arg parsing ───

const args = process.argv.slice(2);
const inputFile = args[0] || 'output/report.html';
const outputFile = args[1] || inputFile.replace(/\.html$/i, '.pdf');
const flags = args.slice(2);

const MODE_MAP = { '--landscape': 'landscape', '--no-landscape': 'portrait' };
const mode = flags.reduce((m, f) => MODE_MAP[f] || m, 'auto');

let chromiumPath = null;
const execIdx = flags.indexOf('--chromium');
if (execIdx !== -1 && flags[execIdx + 1]) {
  chromiumPath = flags[execIdx + 1];
}

// ─── Resolve absolute paths ───

const htmlPath = path.resolve(inputFile);
if (!fs.existsSync(htmlPath)) {
  console.error(`ERROR: HTML file not found: ${htmlPath}`);
  process.exit(1);
}

const pdfPath = path.resolve(outputFile);
const baseDir = path.dirname(htmlPath);

// ─── Load + patch HTML ───

let html = fs.readFileSync(htmlPath, 'utf-8');

// Fix relative image paths → absolute file:// for puppeteer
const relImgRegex = /(src|href)=["'](?!https?:\/\/|data:|file:\/\/)([^"']+)["']/g;
html = html.replace(relImgRegex, (match, attr, relPath) => {
  const abs = path.resolve(baseDir, relPath);
  return `${attr}="file://${abs}"`;
});

// Inject print CSS — portrait A4 handled by puppeteer format:'A4'
// Only inject landscape overrides and table header repeating
const printCSS = `
  @page landscape {
    size: A4 landscape;
  }
  .diagram-container {
    page: landscape;
    break-before: page;
    break-after: page;
  }
  thead {
    display: table-header-group;
  }
  tr {
    page-break-inside: avoid;
  }
`;

// Insert before closing </head> if present, otherwise before <body>
if (html.includes('</style>')) {
  html = html.replace('</style>', `</style>\n${printCSS}`);
} else if (html.includes('</head>')) {
  html = html.replace('</head>', `<style>\n${printCSS}\n</style>\n</head>`);
} else {
  html = `<style>\n${printCSS}\n</style>\n${html}`;
}

// ─── Launch Chromium ───

const launchOpts = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

if (chromiumPath) {
  launchOpts.executablePath = chromiumPath;
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch(launchOpts);
  } catch (err) {
    // Try system Chromium
    const candidates = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
    for (const exe of candidates) {
      if (fs.existsSync(exe)) {
        try {
          browser = await puppeteer.launch({ ...launchOpts, executablePath: exe });
          break;
        } catch (_) {}
      }
    }
    if (!browser) {
      console.error('ERROR: Cannot launch Chromium for PDF rendering.');
      console.error('Install chromium or pass --chromium /usr/bin/chromium');
      process.exit(1);
    }
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.emulateMediaType('screen');

  const pdfOpts = {
    path: pdfPath,
    format: 'A4',
    landscape: mode === 'landscape',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '2cm', bottom: '2cm', left: '1.8cm', right: '1.8cm' },
  };

  await page.pdf(pdfOpts);

  const pdfSize = (fs.statSync(pdfPath).size / 1024).toFixed(1);
  console.log(`PDF generated: ${pdfPath} (${pdfSize} KB)`);
  await browser.close();
})();
