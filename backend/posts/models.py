from django.db import models
from django.conf import settings

class Post(models.Model):
    VISIBILITY_CHOICES = (
        ('public', 'Public'),
        ('friends', 'Friends Only'),
        ('private', 'Only Me'),
    )
    
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    page = models.ForeignKey('pages.Page', on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', null=True, blank=True)
    video = models.FileField(upload_to='post_videos/', null=True, blank=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.author.username} - {self.title if self.title else self.content[:50]}"

    class Meta:
        ordering = ['-created_at']

class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"
