from django.contrib import admin
from .models import Post, Like

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'page', 'content_preview', 'visibility', 'created_at', 'updated_at']
    list_filter = ['visibility', 'created_at', 'updated_at', 'page']
    search_fields = ['author__username', 'content', 'title', 'page__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['visibility']
    actions = ['make_public', 'make_friends_only', 'make_private']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def make_public(self, request, queryset):
        """Bulk action to make posts public"""
        updated = queryset.update(visibility='public')
        self.message_user(request, f'{updated} post(s) changed to Public.')
    make_public.short_description = 'Change visibility to Public'
    
    def make_friends_only(self, request, queryset):
        """Bulk action to make posts friends-only"""
        updated = queryset.update(visibility='friends')
        self.message_user(request, f'{updated} post(s) changed to Friends Only.')
    make_friends_only.short_description = 'Change visibility to Friends Only'
    
    def make_private(self, request, queryset):
        """Bulk action to make posts private"""
        updated = queryset.update(visibility='private')
        self.message_user(request, f'{updated} post(s) changed to Private.')
    make_private.short_description = 'Change visibility to Private'

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__id']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
