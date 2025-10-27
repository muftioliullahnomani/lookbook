from django.contrib import admin
from .models import Comment

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'post', 'content_preview', 'is_hidden', 'created_at', 'updated_at']
    list_filter = ['is_hidden', 'created_at', 'updated_at']
    search_fields = ['author__username', 'content', 'post__id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_hidden']
    actions = ['hide_comments', 'unhide_comments']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def hide_comments(self, request, queryset):
        """Bulk action to hide comments"""
        updated = queryset.update(is_hidden=True)
        self.message_user(request, f'{updated} comment(s) hidden successfully.')
    hide_comments.short_description = 'Hide selected comments'
    
    def unhide_comments(self, request, queryset):
        """Bulk action to unhide comments"""
        updated = queryset.update(is_hidden=False)
        self.message_user(request, f'{updated} comment(s) unhidden successfully.')
    unhide_comments.short_description = 'Unhide selected comments'
