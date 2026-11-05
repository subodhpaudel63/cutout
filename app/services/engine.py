"""Background removal: model sessions and the cut-out pipeline."""
from threading import Lock

from PIL import Image
from rembg import new_session, remove

from ..config import MODELS, Config
from .refine import refine_alpha, trim_to_subject

_sessions: dict = {}
_lock = Lock()


def get_session(model: str):
    with _lock:
        if model not in _sessions:
            _sessions[model] = new_session(MODELS[model])
        return _sessions[model]


def cut_out(img: Image.Image, model: str, matting: bool, level: int, trim: bool) -> Image.Image:
    """Return an RGBA cut-out at the original resolution."""
    small = img.copy()
    small.thumbnail((Config.INFER_SIDE, Config.INFER_SIDE), Image.LANCZOS)
    cut = remove(
        small, session=get_session(model), alpha_matting=matting,
        alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10,
        alpha_matting_erode_size=8, post_process_mask=True,
    )
    mask = cut.getchannel("A")
    if mask.size != img.size:  # apply the mask to the full-resolution original
        mask = mask.resize(img.size, Image.LANCZOS)
    out = img.convert("RGBA")
    out.putalpha(mask)
    out = refine_alpha(out, level, max(img.size) / Config.INFER_SIDE)
    return trim_to_subject(out) if trim else out


def warm_up() -> None:
    cut_out(Image.new("RGB", (256, 256), "white"), Config.DEFAULT_MODEL, False, 0, False)
