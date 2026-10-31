"""Print submission.html to 낮에도별은빛나니까_허대훈.pdf with headless Chrome.

  python make_pdf.py           (needs img/*.jpg and qr_inline.svg next to it)
"""
import pathlib
import subprocess

HERE = pathlib.Path(__file__).parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
src = (HERE / "submission.html").read_text(encoding="utf-8")
src = src.replace("%%QR%%", (HERE / "qr_inline.svg").read_text(encoding="utf-8"))
tmp = HERE / "_print.html"
tmp.write_text(src, encoding="utf-8")
out = HERE / "낮에도별은빛나니까_허대훈.pdf"
subprocess.run([CHROME, "--headless=new", "--no-pdf-header-footer", "--virtual-time-budget=15000",
                f"--print-to-pdf={out}", tmp.as_uri()], check=True, capture_output=True)
shot = HERE / "_preview.png"
subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--window-size=794,2246", "--virtual-time-budget=15000",
                f"--screenshot={shot}", tmp.as_uri()], check=True, capture_output=True)
print(out, out.stat().st_size)
