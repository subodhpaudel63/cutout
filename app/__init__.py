from flask import Flask

from .config import Config


def create_app(config: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config)

    from .routes import bp  # imported here so light modules stay importable without rembg

    app.register_blueprint(bp)
    return app
