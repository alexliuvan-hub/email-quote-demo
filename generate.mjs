/**
 * Generate personalized quote-calculator sites from businesses.csv.
 *
 * For each business_name:
 *   - Create generated/<slug>/
 *   - Copy index.html, calculator.js, app.js, styles.css
 *   - Replace {{BUSINESS_NAME}} in HTML + calculator.js
 *
 * Run from the project root:
 *   node generate.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(ROOT, "businesses.csv");
const OUT_DIR = join(ROOT, "generated");
const TEMPLATE_FILES = ["index.html", "calculator.js", "app.js", "styles.css"];
const TOKEN = "{{BUSINESS_NAME}}";

function slugify(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "business";
}

/** Minimal CSV parser for a single business_name column (handles quotes). */
function loadBusinessNames(csvPath) {
  if (!existsSync(csvPath)) {
    console.error(
      `Missing businesses.csv. Put your CSV in the project root with a header column named business_name.`
    );
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    console.error("No business names found in the CSV.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const nameIdx = header.indexOf("business_name");
  if (nameIdx === -1) {
    console.error(`CSV must have a header column named business_name (found: ${header.join(", ")})`);
    process.exit(1);
  }

  const names = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = (cols[nameIdx] || "").trim();
    if (name) names.push(name);
  }

  if (!names.length) {
    console.error("No business names found in the CSV.");
    process.exit(1);
  }

  return names;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function writePersonalizedCopy(businessName, destDir) {
  mkdirSync(destDir, { recursive: true });

  for (const filename of TEMPLATE_FILES) {
    const src = join(ROOT, filename);
    if (!existsSync(src)) {
      console.error(`Missing template file: ${filename}`);
      process.exit(1);
    }

    if (filename === "index.html" || filename === "calculator.js") {
      const text = readFileSync(src, "utf8");
      if (filename === "index.html" && !text.includes(TOKEN)) {
        console.error(`${filename} has no ${TOKEN} token — tokenize the template first.`);
        process.exit(1);
      }
      writeFileSync(join(destDir, filename), text.split(TOKEN).join(businessName), "utf8");
    } else {
      cpSync(src, join(destDir, filename));
    }
  }
}

function main() {
  for (const filename of TEMPLATE_FILES) {
    if (!existsSync(join(ROOT, filename))) {
      console.error(`Missing template file: ${filename}`);
      process.exit(1);
    }
  }

  const names = loadBusinessNames(CSV_PATH);

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const usedSlugs = new Map();
  console.log(`Generating ${names.length} site(s) into generated/ ...`);

  for (const name of names) {
    const base = slugify(name);
    const count = usedSlugs.get(base) || 0;
    usedSlugs.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;

    writePersonalizedCopy(name, join(OUT_DIR, slug));
    console.log(`  OK  "${name}" -> generated/${slug}/`);
  }

  console.log("Done.");
}

main();
