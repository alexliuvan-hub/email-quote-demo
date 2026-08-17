/**
 * Generate personalized quote-calculator sites from CSV lists.
 *
 * Reads every *.csv in the project root that has a business_name column
 * (e.g. businesses.csv, texasbusinesses.csv), merges names, then for each:
 *   - Create generated/<slug>/
 *   - Copy index.html, calculator.js, app.js, styles.css
 *   - Replace {{BUSINESS_NAME}} in HTML + calculator.js
 * Also refreshes LINKS.md with live GitHub Pages URLs.
 *
 * Run from the project root:
 *   node generate.mjs
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  rmSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(ROOT, "generated");
const LINKS_PATH = join(ROOT, "LINKS.md");
const PAGES_BASE = "https://alexliuvan-hub.github.io/email-quote-demo/generated";
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

function findBusinessCsvFiles() {
  return readdirSync(ROOT)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .map((name) => join(ROOT, name))
    .filter((path) => {
      const first = readFileSync(path, "utf8")
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .find((line) => line.trim() !== "");
      if (!first) return false;
      return parseCsvLine(first)
        .map((h) => h.trim())
        .includes("business_name");
    })
    .sort();
}

/** Minimal CSV parser for a business_name column (handles quotes). */
function loadBusinessNames(csvPath) {
  const raw = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const nameIdx = header.indexOf("business_name");
  if (nameIdx === -1) return [];

  const names = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = (cols[nameIdx] || "").trim();
    if (name) names.push(name);
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

function writeLinksMarkdown(slugs) {
  const lines = [
    "# Live demo links",
    "",
    "Paste these into cold emails after GitHub Pages deploy finishes.",
    "",
    "| Business folder | Live URL |",
    "|---|---|",
  ];
  for (const slug of slugs) {
    lines.push(`| \`${slug}\` | ${PAGES_BASE}/${slug}/ |`);
  }
  lines.push("");
  writeFileSync(LINKS_PATH, lines.join("\n"), "utf8");
}

function main() {
  for (const filename of TEMPLATE_FILES) {
    if (!existsSync(join(ROOT, filename))) {
      console.error(`Missing template file: ${filename}`);
      process.exit(1);
    }
  }

  const csvFiles = findBusinessCsvFiles();
  if (!csvFiles.length) {
    console.error(
      "No CSV files with a business_name column found in the project root."
    );
    process.exit(1);
  }

  const seen = new Set();
  const names = [];
  for (const csvPath of csvFiles) {
    const fromFile = loadBusinessNames(csvPath);
    console.log(`Reading ${csvPath.split(/[/\\]/).pop()} (${fromFile.length} names)`);
    for (const name of fromFile) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }

  if (!names.length) {
    console.error("No business names found in the CSV file(s).");
    process.exit(1);
  }

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const usedSlugs = new Map();
  const slugs = [];
  console.log(`Generating ${names.length} site(s) into generated/ ...`);

  for (const name of names) {
    const base = slugify(name);
    const count = usedSlugs.get(base) || 0;
    usedSlugs.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    slugs.push(slug);

    writePersonalizedCopy(name, join(OUT_DIR, slug));
    console.log(`  OK  "${name}" -> generated/${slug}/`);
  }

  writeLinksMarkdown(slugs.sort());
  console.log("Updated LINKS.md");
  console.log("Done.");
}

main();
