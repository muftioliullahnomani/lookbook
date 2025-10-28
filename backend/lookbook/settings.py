from pathlib import Path
import os
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

try:
    # Optional: load variables from a .env file if present (local/dev convenience)
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()  # no-op if file not present
except Exception:
    pass

# -------------------------------
# Basic Paths and Security
# -------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

def get_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return v.strip() in {"1", "true", "True", "YES", "yes"}

# Secret key
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# Debug mode: default False for safety
DEBUG = get_bool('DJANGO_DEBUG', default=False)

if not SECRET_KEY:
    if DEBUG:
        # Dev fallback only
        SECRET_KEY = 'django-insecure-dev-key-change-me'
    else:
        raise ImproperlyConfigured('DJANGO_SECRET_KEY is required in production')

def parse_csv_env(name: str, defaults: list[str] | None = None) -> list[str]:
    raw = os.getenv(name)
    if raw:
        return [h.strip() for h in raw.split(',') if h.strip()]
    return defaults or []

ALLOWED_HOSTS = parse_csv_env(
    'DJANGO_ALLOWED_HOSTS',
    defaults=['localhost', '127.0.0.1', '[::1]'] if DEBUG else []
)

# -------------------------------
# Installed Apps
# -------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'whitenoise.runserver_nostatic',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    'drf_spectacular_sidecar',

    # Local apps
    'users',
    'posts',
    'comments',
    'friends',
    'pages',
    'groups',
]

# -------------------------------
# Middleware
# -------------------------------

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lookbook.urls'

# -------------------------------
# Templates
# -------------------------------

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lookbook.wsgi.application'

# -------------------------------
# Database (SQLite for now)
# -------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# -------------------------------
# Password Validation
# -------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -------------------------------
# Internationalization
# -------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# -------------------------------
# Static and Media Files
# -------------------------------

STATIC_URL = '/static/'

STATICFILES_DIRS = []

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -------------------------------
# REST Framework & JWT
# -------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

AUTH_USER_MODEL = 'users.User'

# -------------------------------
# CORS (for local + production)
# -------------------------------

if DEBUG:
    CORS_ALLOWED_ORIGINS = parse_csv_env(
        'DJANGO_CORS_ALLOWED_ORIGINS',
        defaults=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    )
else:
    CORS_ALLOWED_ORIGINS = parse_csv_env('DJANGO_CORS_ALLOWED_ORIGINS', defaults=[])

CORS_ALLOW_CREDENTIALS = True

# -------------------------------
# CSRF, Security & HTTPS
# -------------------------------

CSRF_TRUSTED_ORIGINS = parse_csv_env(
    'DJANGO_CSRF_TRUSTED_ORIGINS',
    defaults=(
        ['http://localhost:8000', 'http://127.0.0.1:8000'] if DEBUG else []
    ),
)

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# -------------------------------
# Default Primary Key
# -------------------------------

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------
# React + Django Integration
# -------------------------------
# Serve React index.html as main template
# (Handled in urls.py using TemplateView)

# -------------------------------
# API Schema / Docs (drf-spectacular)
# -------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'Lookbook API',
    'DESCRIPTION': 'REST API documentation for Lookbook',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
