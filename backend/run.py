"""Application entry point."""
import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Listen on localhost only when testing/dev; use gunicorn in prod
    # Disable debug reloader by default to avoid child process issues
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="127.0.0.1", port=5000, debug=debug, use_reloader=False)
