"""Entry point: python run.py"""
import os

from app import create_app
from app.services.engine import warm_up

app = create_app()

if __name__ == "__main__":
    print("Loading model…")
    warm_up()  # first request is fast because the default model is already loaded
    port = int(os.environ.get("PORT", 5000))
    print(f"Ready: http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, threaded=True)
