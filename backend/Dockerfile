# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY backend/ .

# Environment
ENV DJANGO_SETTINGS_MODULE=lookbook.settings

# Static collection (optional; can also be run in CI)
# RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "lookbook.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4"]
