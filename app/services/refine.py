"""Edge refinement and cropping (pure Pillow/NumPy, no AI model needed)."""
import numpy as np
from PIL import Image, ImageFilter

_CURVES = {1: (0.06, 0.94), 2: (0.12, 0.88), 3: (0.2, 0.8)}


def refine_alpha(img: Image.Image, level: int, scale: float = 1.0) -> Image.Image:
    """Remove halos and sharpen edges. level: 0 (off) to 3 (strong)."""
    if level <= 0:
        return img
    r, g, b, a = img.split()
    if level >= 2:  # pull the edge in to remove the light fringe
        a = a.filter(ImageFilter.MinFilter(3 if scale < 2.5 else 5))
    arr = np.asarray(a, dtype=np.float32) / 255.0
    lo, hi = _CURVES[level]
    arr = np.clip((arr - lo) / (hi - lo), 0, 1)
    arr = arr * arr * (3 - 2 * arr)  # smoothstep: crisp but anti-aliased
    a = Image.fromarray((arr * 255).astype(np.uint8))
    a = a.filter(ImageFilter.GaussianBlur(0.5 * max(1.0, scale ** 0.5)))
    return Image.merge("RGBA", (r, g, b, a))


def trim_to_subject(img: Image.Image, margin: float = 0.02) -> Image.Image:
    """Crop to the visible subject plus a small margin."""
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return img
    pad = int(max(img.size) * margin)
    return img.crop((max(0, box[0] - pad), max(0, box[1] - pad),
                     min(img.width, box[2] + pad), min(img.height, box[3] + pad)))
