# Lookbook Backend

Production-ready Django REST backend with JWT auth.

## Features
- Django + DRF + SimpleJWT
- CORS + CSRF configured via environment variables
- Env-driven settings with `.env` (python-dotenv)
- Gunicorn Procfile and Dockerfile for easy deployment
- Static served by WhiteNoise

## Requirements
- Python 3.12
- pip

## Quick Start (Local)
1. Create and activate a virtualenv (recommended).
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Install deps:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and create a superuser (optional):
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
5. Start server:
   ```bash
   python manage.py runserver
   ```

## Environment Variables
- `DJANGO_SECRET_KEY`: required in production
- `DJANGO_DEBUG`: set to `1` for local dev
- `DJANGO_ALLOWED_HOSTS`: comma-separated list
- `DJANGO_CORS_ALLOWED_ORIGINS`: comma-separated list
- `DJANGO_CSRF_TRUSTED_ORIGINS`: comma-separated list (must include scheme)

## Deployment (Gunicorn / Procfile)
- Use the provided `Procfile`:
  ```
  web: gunicorn lookbook.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --threads ${WEB_THREADS:-4}
  ```
- Ensure environment variables are set.
- Run collectstatic if you have static assets:
  ```bash
  python manage.py collectstatic --noinput
  ```

## Docker
Build and run:
```bash
docker build -t lookbook-backend -f Dockerfile .
docker run -p 8000:8000 --env-file .env lookbook-backend
```

## Notes
- Default DB is SQLite for simplicity. For production, consider Postgres and configure `DATABASES`.
- When `DJANGO_DEBUG` is not `1`, `DJANGO_SECRET_KEY` must be set or the app will refuse to start.
