# Use official lightweight Python image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies for PostgreSQL, Pillow, cryptography, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . /app/

# Port exposure
EXPOSE 8000

# Set default execution command to run Daphne (ASGI Channel/WebSockets support)
# Daphne matches production requirements since Django Channels is integrated.
WORKDIR /app/handyman
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "handyman.asgi:application"]
