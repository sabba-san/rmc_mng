"""Application entry point."""
from app import create_app

app = create_app()

if __name__ == "__main__":
    # Listen on localhost only when testing/dev; use gunicorn in prod
    app.run(host="127.0.0.1", port=5000, debug=True)
