"""Build the piece from src/ into one page.

  python build.py

Outputs
  docs/index.html (+ docs/assets/)  the site GitHub Pages serves (deploy.py pushes it)
  build/starry-letter.html          a page fragment for the claude.ai Artifact (painting inlined as a data URI)

src/ also runs as it is, without building: serve src/ (python -m http.server) and open index.html.
"""
import base64
import re
import html
import json
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
DOCS = ROOT / "docs"
BUILD = ROOT / "build"
BUILD.mkdir(exist_ok=True)
(DOCS / "assets").mkdir(parents=True, exist_ok=True)


def run(cmd):
    return subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8", shell=True).stdout


# 1. one JS bundle; three.js itself stays on the CDN (import map), its addons (GLTF loader...) come from node_modules
run("node bundle.mjs")
bundle = (BUILD / "bundle.js").read_text(encoding="utf-8").replace("</script", "<\\/script")

# 2. the letter as plain text, for readers without JavaScript (read straight from content/*.js)
letter_url = (SRC / "js/content/letter.js").as_uri()
beats_url = (SRC / "js/content/beats.js").as_uri()
data = json.loads(run(
    'node --input-type=module -e "'
    f"const L = await import('{letter_url}'); const B = await import('{beats_url}');"
    'console.log(JSON.stringify({LINES: L.LINES, LETTER: L.LETTER || null, ENDING: L.ENDING, OPENING: L.OPENING, BEATS: B.BEATS}))"'
))


def final_of(ops):
    s = ""
    for o, v in ops:
        if o == "t":
            s += v
        elif o == "d":
            s = s[:-v]
    return s


lines = []
for b in data["BEATS"]:  # a `read` beat brings the whole letter (LETTER); lines already shown are not repeated
    texts = [final_of(data["LINES"][b["line"]])] if b.get("line") else (data["LETTER"] or {}).get("paragraphs", []) if b.get("read") else []
    lines += [t for t in texts if t not in lines]
noscript = (
    f"<p>{html.escape(data['ENDING']['subject'])} — 자바스크립트가 꺼져 있어 글로만 보여 드립니다.</p>"
    f"<p>{html.escape(data['OPENING'])}</p><p>" + "<br>".join(html.escape(l) for l in lines) + "</p>"
    f"<p>받는 사람: {html.escape(data['ENDING']['to'])}</p>"
)

# 3. assemble
page = (SRC / "index.html").read_text(encoding="utf-8")
css = (SRC / "style.css").read_text(encoding="utf-8")
page = page.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + css + "</style>")
fallback = (BUILD / "fallback.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
page = page.replace('<script type="module" src="js/fallback.js"></script>', '<script type="module">\n' + fallback + "</script>")
page = page.replace('<script type="module" src="js/main.js"></script>', '<script type="module">\n' + bundle + "</script>")
page = page.replace("%%NOSCRIPT%%", noscript)
(DOCS / "index.html").write_text(page, encoding="utf-8")
shutil.copytree(SRC / "assets", DOCS / "assets", dirs_exist_ok=True)
(DOCS / ".nojekyll").write_text("", encoding="utf-8")

# 4. the Artifact fragment: what sits between the HEAD and BODY markers, painting inlined
def between(s, a, b):
    return s.split(a, 1)[1].split(b, 1)[0]


b64 = base64.b64encode((SRC / "assets/starry.jpg").read_bytes()).decode()
frag = between(page, "<!--HEAD-->", "<!--/HEAD-->") + between(page, "<!--BODY-->", "<!--/BODY-->")
frag = frag.replace('src="assets/starry.jpg"', 'src="data:image/jpeg;base64,' + b64 + '"')
# the preview can't serve .glb files: inline the people models, people.js parses them without a fetch
for tag, name in (("personGlb", "person.glb"), ("childGlb", "child.glb")):
    if (SRC / "assets/models" / name).exists():
        glb = base64.b64encode((SRC / "assets/models" / name).read_bytes()).decode()
        frag = frag.replace('<script type="module">', f'<script type="text/plain" id="{tag}">' + glb + '</script>\n<script type="module">', 1)
# the Artifact viewer gets plain CDN imports instead of the import map
THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
frag = re.sub(r'<script type="importmap">.*?</script>\n?', "", frag, flags=re.S)
frag = re.sub(r'from\s*"three"', f'from "{THREE_URL}"', frag)
(BUILD / "starry-letter.html").write_text(frag, encoding="utf-8")

for p in ("docs/index.html", "build/starry-letter.html"):
    print(p, (ROOT / p).stat().st_size)
