from django.contrib import admin
from .models import Friendship

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ['id', 'from_user', 'to_user', 'status', 'created_at', 'updated_at', 'status_badge']
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['from_user__username', 'to_user__username', 'from_user__email', 'to_user__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['status']  # Allow editing status directly from list view
    actions = ['accept_requests', 'reject_requests', 'mark_as_pending']
    
    def status_badge(self, obj):
        """Display status with color coding, show 'BLOCKED' if user is disabled"""
        # Check if either user is disabled
        if not obj.from_user.is_active or not obj.to_user.is_active:
            return f'<span style="color: red; font-weight: bold;">●</span> BLOCKED (USER DISABLED)'
        
        colors = {
            'pending': 'orange',
            'accepted': 'green',
            'rejected': 'red',
            'blocked': 'darkred'
        }
        return f'<span style="color: {colors.get(obj.status, "black")}; font-weight: bold;">●</span> {obj.status.upper()}'
    status_badge.short_description = 'Status'
    status_badge.allow_tags = True
    
    def accept_requests(self, request, queryset):
        """Bulk action to accept friend requests"""
        updated = queryset.update(status='accepted')
        self.message_user(request, f'{updated} friend request(s) accepted successfully.')
    accept_requests.short_description = 'Accept selected friend requests'
    
    def reject_requests(self, request, queryset):
        """Bulk action to reject friend requests"""
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} friend request(s) rejected.')
    reject_requests.short_description = 'Reject selected friend requests'
    
    def mark_as_pending(self, request, queryset):
        """Bulk action to mark as pending"""
        updated = queryset.update(status='pending')
        self.message_user(request, f'{updated} friend request(s) marked as pending.')
    mark_as_pending.short_description = 'Mark as pending'
