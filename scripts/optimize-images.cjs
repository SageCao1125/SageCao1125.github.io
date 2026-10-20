// Requires sharp: npm install --no-save sharp
// Keep originals; use lossless alternatives only when decoded pixels match.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const pages = [
  "index.html", "partials/home.html", "partials/about.html",
  "partials/publications.html", "partials/portfolio.html",
];

async function main() {
  const contents = new Map();
  const sources = new Set();
  for (const page of pages) {
    const html = await fs.readFile(path.join(root, page), "utf8");
    contents.set(page, html);
    for (const match of html.matchAll(/["']((?:images|data)\/[^"']+\.(?:png|jpe?g))["']/gi)) {
      sources.add(match[1]);
    }
  }
  for (const source of sources) {
    const input = path.join(root, source);
    const stat = await fs.stat(input).catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!stat) continue;
    if (stat.size < 100000) continue;
    const metadata = await sharp(input).metadata();
    if (metadata.pages > 1) continue;
    const output = await sharp(input).autoOrient().keepIccProfile()
      .webp({ lossless: true, effort: 4 }).toBuffer();
    if (output.length >= stat.size * 0.95) {
      console.log(`KEEP ${source}: ${stat.size} -> ${output.length}`);
      continue;
    }
    const before = await sharp(input).autoOrient().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const after = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (before.info.width !== after.info.width || before.info.height !== after.info.height ||
        !before.data.equals(after.data)) {
      console.log(`SKIP pixel mismatch: ${source}`);
      continue;
    }
    const target = source + ".lossless.webp";
    await fs.writeFile(path.join(root, target), output);
    for (const [page, html] of contents) {
      contents.set(page, html.split('"' + source + '"').join('"' + target + '"')
        .split("'" + source + "'").join("'" + target + "'"));
    }
    console.log(`PASS ${source}: ${before.info.width}x${before.info.height}, ${stat.size} -> ${output.length} bytes, identical pixels`);
  }
  for (const [page, html] of contents) {
    const destination = path.join(root, page);
    if (html !== await fs.readFile(destination, "utf8")) await fs.writeFile(destination, html);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
