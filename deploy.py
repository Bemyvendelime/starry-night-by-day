"""Build and publish to GitHub Pages (main branch, /docs).

  python deploy.py "what changed"
"""
import subprocess
import sys
import pathlib

ROOT = pathlib.Path(__file__).parent
msg = sys.argv[1] if len(sys.argv) > 1 else "update"


def git(*args, check=True):
    return subprocess.run(["git", *args], cwd=ROOT, check=check, capture_output=True, text=True, encoding="utf-8")


subprocess.run([sys.executable, "build.py"], cwd=ROOT, check=True)
git("add", "-A")
if git("diff", "--cached", "--quiet", check=False).returncode == 0:
    print("nothing to publish")
    sys.exit(0)
git("commit", "-m", msg)
print(git("push", "origin", "main").stderr.strip())
print("published: https://bemyvendelime.github.io/starry-night-by-day/  (GitHub Pages takes a minute or two)")
