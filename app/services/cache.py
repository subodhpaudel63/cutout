from __future__ import annotations

"""Small thread-safe LRU cache for finished PNG results."""
from collections import OrderedDict
from threading import Lock


class ResultCache:
    def __init__(self, max_items: int):
        self._max = max_items
        self._data: OrderedDict[str, bytes] = OrderedDict()
        self._lock = Lock()

    def get(self, key: str) -> bytes | None:
        with self._lock:
            if key in self._data:
                self._data.move_to_end(key)
                return self._data[key]
            return None

    def set(self, key: str, value: bytes) -> None:
        with self._lock:
            self._data[key] = value
            while len(self._data) > self._max:
                self._data.popitem(last=False)
