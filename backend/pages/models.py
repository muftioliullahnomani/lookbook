from django.db import models
from django.conf import settings

class Page(models.Model):
    CATEGORY_CHOICES = (
        ('business', 'Business'),
        ('brand', 'Brand'),
        ('community', 'Community'),
        ('entertainment', 'Entertainment'),
        ('education', 'Education'),
        ('nonprofit', 'Non-Profit'),
        ('other', 'Other'),
    )
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_pages')
    name = models.CharField(max_length=200)
    username = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    profile_picture = models.ImageField(upload_to='page_profiles/', null=True, blank=True)
    cover_photo = models.ImageField(upload_to='page_covers/', null=True, blank=True)
    website = models.URLField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=200, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']

class PageFollower(models.Model):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='followers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following_pages')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('page', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} follows {self.page.name}"

class PageAdmin(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('moderator', 'Moderator'),
    )
    
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='admins')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='page_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='editor')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('page', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role} of {self.page.name}"
