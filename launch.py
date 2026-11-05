"""One-step launcher: sets everything up, starts the server and opens your browser.

Run it with:  python launch.py   (or double-click start.bat / start.command)
"""
import hashlib
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import venv
import webbrowser
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
VENV = ROOT / ".venv"
PY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
REQ = ROOT / "requirements.txt"
MARK = VENV / ".requirements-hash"


def free_port(start: int = 5000) -> int:
    for port in range(start, start + 20):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:  # nothing is listening, so it's free
                return port
    sys.exit("No free port found between 5000 and 5019.")


def open_when_ready(url: str) -> None:
    """Wait for the server (the first run may download the model), then open the browser."""
    for _ in range(600):
        try:
            urllib.request.urlopen(url, timeout=1)
            print(f"\nCutout is running at {url}\nPress Ctrl+C in this window to stop it.\n")
            webbrowser.open(url)
            return
        except Exception:
            time.sleep(1)


def main() -> None:
    if sys.version_info < (3, 9):
        sys.exit("Python 3.9 or newer is required. Get it at https://www.python.org/downloads/")

    if not PY.exists():
        print("Creating virtual environment…")
        venv.create(VENV, with_pip=True)

    digest = hashlib.sha1(REQ.read_bytes()).hexdigest()
    if not MARK.exists() or MARK.read_text() != digest:
        print("Installing dependencies. The first run can take a few minutes…")
        subprocess.check_call([str(PY), "-m", "pip", "install", "--upgrade", "pip"])
        subprocess.check_call([str(PY), "-m", "pip", "install", "-r", str(REQ)])
        MARK.write_text(digest)

    port = free_port()
    threading.Thread(target=open_when_ready, args=(f"http://127.0.0.1:{port}",), daemon=True).start()
    print("Starting server (the first run also downloads the AI model)…")
    try:
        subprocess.call([str(PY), str(ROOT / "run.py")], env={**os.environ, "PORT": str(port)}, cwd=ROOT)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        sys.exit(f"Setup failed ({e}). Check your internet connection and try again.")
