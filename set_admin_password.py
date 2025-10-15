import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lookbook.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    admin = User.objects.get(username='admin')
    admin.set_password('admin123')
    admin.save()
    print('Admin password set to: admin123')
except User.DoesNotExist:
    print('Admin user not found')
