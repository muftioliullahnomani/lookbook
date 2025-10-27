import os
import sys
from pathlib import Path

# Project root (e.g., /home/eduaids/backend)
BASE_DIR = Path(__file__).resolve().parent

# Ensure backend root is on sys.path so Django modules can be imported
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Point to your Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lookbook.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
