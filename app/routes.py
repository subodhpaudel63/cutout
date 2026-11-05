import hashlib
import io
from dataclasses import dataclass

from flask import Blueprint, current_app, jsonify, render_template, request, send_file
from PIL import Image, ImageOps

from .config import MODELS, Config
from .services.cache import ResultCache
from .services.engine import cut_out

bp = Blueprint("main", __name__)
cache = ResultCache(Config.CACHE_MAX)


@dataclass(frozen=True)
class Options:
    model: str = "balanced"
    matting: bool = False
    refine: int = 2
    trim: bool = False

    @classmethod
    def from_form(cls, form) -> "Options":
        model = form.get("model", cls.model)
        if model not in MODELS:
            raise ValueError("Unknown model.")
        return cls(model, form.get("matting") == "1",
                   max(0, min(3, int(form.get("refine", 2)))), form.get("trim") == "1")


@bp.get("/")
def index():
    return render_template("index.html")


@bp.post("/api/remove")
def remove_background():
    file = request.files.get("image")
    if not file:
        return jsonify(error="No image received. Choose a PNG, JPG or WebP file."), 400
    try:
        opts = Options.from_form(request.form)
    except ValueError as e:
        return jsonify(error=str(e)), 400

    data = file.read()
    key = hashlib.sha1(data + repr(opts).encode()).hexdigest()
    png = cache.get(key)  # same image + settings gives an instant, identical result
    if png is None:
        try:
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
        except Exception:
            return jsonify(error="That file isn't a readable image."), 400
        side = current_app.config["MAX_SIDE"]
        if max(img.size) > side:
            img.thumbnail((side, side), Image.LANCZOS)
        buf = io.BytesIO()
        cut_out(img, opts.model, opts.matting, opts.refine, opts.trim).save(buf, "PNG", compress_level=3)
        png = buf.getvalue()
        cache.set(key, png)
    return send_file(io.BytesIO(png), mimetype="image/png")
