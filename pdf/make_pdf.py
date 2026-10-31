"""Print submission.html to 낮에도별은빛나니까_허대훈.pdf with headless Chrome.

  python make_pdf.py           (needs img/*.jpg and qr_inline.svg next to it)
"""
import pathlib
import subprocess

HERE = pathlib.Path(__file__).parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
src = (HERE / "submission.html").read_text(encoding="utf-8")
src = src.replace("%%QR%%", (HERE / "qr_inline.svg").read_text(encoding="utf-8"))
credits = HERE.parent / "src" / "assets" / "models" / "CREDITS.json"
model_credit = ""
if credits.exists():
    import json
    model_credit = "3D 인물: " + " · ".join(f"{c['name']} ({c['author']}, {c['license']})" for c in json.loads(credits.read_text(encoding="utf-8")))
src = src.replace("%%MODEL_CREDIT%%", model_credit)
tmp = HERE / "_print.html"
tmp.write_text(src, encoding="utf-8")
# file name rule from the contest: 이름(지식향연 홈페이지 ID)_제목 (replace 아이디 with the real ID)
out = HERE / "허대훈(아이디)_낮에도 별은 빛나니까.pdf"
subprocess.run([CHROME, "--headless=new", "--no-pdf-header-footer", "--virtual-time-budget=15000",
                f"--print-to-pdf={out}", tmp.as_uri()], check=True, capture_output=True)
shot = HERE / "_preview.png"
subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--window-size=794,3369", "--virtual-time-budget=15000",
                f"--screenshot={shot}", tmp.as_uri()], check=True, capture_output=True)
print(out, out.stat().st_size)
