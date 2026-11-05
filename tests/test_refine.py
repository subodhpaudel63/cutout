from PIL import Image

from app.services.refine import refine_alpha, trim_to_subject


def _square():
    img = Image.new("RGBA", (100, 100), (255, 0, 0, 0))
    img.paste((255, 0, 0, 255), (40, 40, 60, 60))
    return img


def test_refine_keeps_size_and_core():
    out = refine_alpha(_square(), 2)
    assert out.size == (100, 100)
    assert out.getpixel((50, 50))[3] == 255


def test_refine_off_is_identity():
    img = _square()
    assert refine_alpha(img, 0) is img


def test_trim_crops_to_subject():
    out = trim_to_subject(_square(), margin=0)
    assert out.size == (20, 20)
