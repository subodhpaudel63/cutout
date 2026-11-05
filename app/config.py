"""All tunable settings in one place."""


class Config:
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # max upload size per image (bytes)
    MAX_SIDE = 4096       # larger photos are scaled down to this long side
    INFER_SIDE = 1280     # AI mask is computed at this size, then scaled to full resolution
    CACHE_MAX = 64        # number of recent results kept in memory
    DEFAULT_MODEL = "balanced"


MODELS = {
    "balanced": "isnet-general-use",   # best all-rounder
    "portrait": "u2net_human_seg",     # people
    "precision": "birefnet-general",   # sharpest, slower
    "fast": "u2netp",                  # quick previews
}
