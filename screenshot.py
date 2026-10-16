"""
Take a preview screenshot of every demo in generated/ and save it to previews/<slug>.png.
previews/ is NOT wiped by generate.mjs, so screenshots survive regenerating.

Run from the project root after `node generate.mjs`:
  python3 screenshot.py            # only demos missing a screenshot
  python3 screenshot.py --all      # redo every screenshot
Needs: pip install playwright && python3 -m playwright install chromium
"""
import os, sys, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(ROOT, "generated")
OUT = os.path.join(ROOT, "previews")
PORT = 8799
os.makedirs(OUT, exist_ok=True)
redo = "--all" in sys.argv

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
handler.log_message = lambda *a: None
httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()

slugs = sorted(d for d in os.listdir(GEN) if os.path.isfile(os.path.join(GEN, d, "index.html")))
todo = [s for s in slugs if redo or not os.path.exists(os.path.join(OUT, f"{s}.png"))]
print(f"{len(todo)} screenshot(s) to take")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1100, "height": 900})
    for slug in todo:
        page.goto(f"http://127.0.0.1:{PORT}/generated/{slug}/")
        page.wait_for_timeout(1800)
        page.click('[data-tier="40"]')
        page.check("text=Screen cleaning")
        page.wait_for_timeout(1200)
        page.screenshot(path=os.path.join(OUT, f"{slug}.png"), clip={"x": 0, "y": 0, "width": 1100, "height": 520})
        print("  OK", slug)
    browser.close()
httpd.shutdown()
