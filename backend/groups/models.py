from django.db import models
from django.conf import settings

class Group(models.Model):
    PRIVACY_CHOICES = (
        ('public', 'Public'),
        ('private', 'Private'),
    )
    
    CATEGORY_CHOICES = (
        ('general', 'General'),
        ('education', 'Education'),
        ('technology', 'Technology'),
        ('sports', 'Sports'),
        ('entertainment', 'Entertainment'),
        ('business', 'Business'),
        ('health', 'Health & Fitness'),
        ('travel', 'Travel'),
        ('food', 'Food & Cooking'),
        ('gaming', 'Gaming'),
        ('music', 'Music'),
        ('art', 'Art & Design'),
        ('other', 'Other'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    profile_picture = models.ImageField(upload_to='group_profiles/', null=True, blank=True)
    cover_photo = models.ImageField(upload_to='group_covers/', null=True, blank=True)
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='public')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']

class GroupMember(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('member', 'Member'),
    )
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"
