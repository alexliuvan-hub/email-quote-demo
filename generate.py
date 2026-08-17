"""
Generate personalized quote-calculator sites from businesses.csv.

For each business_name:
  - Create generated/<slug>/
  - Copy index.html, calculator.js, app.js, styles.css
  - Replace {{BUSINESS_NAME}} in HTML + calculator.js

Run from the project root:
  python generate.py
"""

from __future__ import annotations

import csv
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "businesses.csv"
OUT_DIR = ROOT / "generated"
TEMPLATE_FILES = ("index.html", "calculator.js", "app.js", "styles.css")
TOKEN = "{{BUSINESS_NAME}}"


def slugify(name: str) -> str:
    """lowercase, spaces -> dashes, strip other punctuation."""
    text = name.strip().lower()
    text = text.replace(" ", "-")
    text = re.sub(r"[^a-z0-9\-]+", "", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "business"


def load_business_names(csv_path: Path) -> list[str]:
    if not csv_path.is_file():
        raise SystemExit(
            f"Missing {csv_path.name}. Put your CSV in the project root "
            f"with a header column named business_name."
        )

    names: list[str] = []
    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "business_name" not in reader.fieldnames:
            raise SystemExit(
                "CSV must have a header column named business_name "
                f"(found: {reader.fieldnames})"
            )
        for row in reader:
            name = (row.get("business_name") or "").strip()
            if name:
                names.append(name)

    if not names:
        raise SystemExit("No business names found in the CSV.")

    return names


def write_personalized_copy(business_name: str, dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)

    for filename in TEMPLATE_FILES:
        src = ROOT / filename
        if not src.is_file():
            raise SystemExit(f"Missing template file: {filename}")

        if filename in ("index.html", "calculator.js"):
            text = src.read_text(encoding="utf-8")
            if TOKEN not in text and filename == "index.html":
                raise SystemExit(
                    f"{filename} has no {TOKEN} token — tokenize the template first."
                )
            dest_dir.joinpath(filename).write_text(
                text.replace(TOKEN, business_name), encoding="utf-8"
            )
        else:
            shutil.copy2(src, dest_dir / filename)


def main() -> None:
    for filename in TEMPLATE_FILES:
        if not (ROOT / filename).is_file():
            raise SystemExit(f"Missing template file: {filename}")

    names = load_business_names(CSV_PATH)

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    used_slugs: dict[str, int] = {}
    print(f"Generating {len(names)} site(s) into {OUT_DIR}/ ...")

    for name in names:
        base = slugify(name)
        count = used_slugs.get(base, 0)
        used_slugs[base] = count + 1
        slug = base if count == 0 else f"{base}-{count + 1}"

        dest = OUT_DIR / slug
        write_personalized_copy(name, dest)
        print(f"  OK  {name!r} -> generated/{slug}/")

    print("Done.")


if __name__ == "__main__":
    main()
