# Cutout

Sharp background remover: Flask + rembg. Delete any image with the Delete button, the Delete key or the ✕ on a result card. Single image or folder mode, compare views (slider, side by side, original, cutout), completed-results grid, edge refinement, custom backgrounds, ZIP export.

## Quick start (easiest)

Double-click the launcher for your system. It creates the environment, installs everything,
starts the server and opens your browser:

- Windows: `start.bat`
- macOS: `start.command` (if macOS blocks it, right-click it, choose Open)
- Linux: `./start.sh`
- Any system: `python launch.py`

The first run takes a few minutes to install packages and download the AI model. Later runs start in seconds.
Close the window or press Ctrl+C to stop the server.

## Run manually

    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    python run.py                                       # http://127.0.0.1:5000

The first run downloads the AI model (about 40 to 170 MB). After that it works offline.

## Structure

    launch.py                 one-step launcher (setup, start, open browser)
    start.bat / start.command / start.sh   double-click wrappers for launch.py
    run.py                    server entry point (loads model, starts server)
    app/
      __init__.py             create_app()
      config.py               settings and model list
      routes.py               page and /api/remove endpoint
      services/
        engine.py             model sessions and cut-out pipeline
        refine.py             edge cleanup and crop (Pillow/NumPy)
        cache.py              in-memory result cache
      templates/index.html    page markup
      templates/_logo.html    inline logo used in the header
      static/
        css/style.css         theme, layout, components
        img/                  logo.svg (mark), logo-full.svg (mark + name), favicon.svg
        js/
          main.js             starts every module
          state.js            shared state
          utils.js            small helpers
          theme.js            light/dark and accent
          intake.js           files, folders, drag-drop, paste
          processing.js       upload queue (2 in parallel)
          viewer.js           thumbnails, compare views, backgrounds
          gallery.js          "Completed" grid with compare and download per image
          exporter.js         PNG/WebP/JPG, clipboard, ZIP
    brand/                    logo files for use elsewhere (logo.svg, logo-full.svg)
    tests/test_refine.py      unit tests (pytest)

## Tuning

Edit `app/config.py`: `INFER_SIDE` (lower is faster), `MAX_SIDE`, `CACHE_MAX`, `MAX_CONTENT_LENGTH`.
For the fastest large batches use the Fast model with Edge cleanup at Light or Medium and Fine edge detail off.

## Tests

    pip install pytest && pytest
