FROM python:3.12-slim

# Install libmagic for python-magic (magic byte file validation)
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload directory outside web root
RUN mkdir -p /uploads && chmod 700 /uploads

EXPOSE 5000

# Use gunicorn in production; workers=4 is a sensible default
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "--timeout", "120", "run:app"]
