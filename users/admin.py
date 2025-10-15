from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from .models import User, BlockedUser, UnblockRequest

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'can_use_rich_editor', 'rich_editor_requested']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'can_use_rich_editor', 'rich_editor_requested']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('bio', 'profile_picture', 'cover_photo', 'date_of_birth', 'location', 'website')}),
        ('Rich Editor Permissions', {'fields': ('can_use_rich_editor', 'rich_editor_requested', 'rich_editor_request_date')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'first_name', 'last_name', 'is_staff', 'is_superuser'),
        }),
    )
    
    readonly_fields = ['rich_editor_request_date']
    
    actions = ['activate_users', 'deactivate_users', 'approve_rich_editor_access', 'revoke_rich_editor_access', 'cancel_rich_editor_request']
    
    def approve_rich_editor_access(self, request, queryset):
        """Bulk action to approve rich editor access"""
        updated = queryset.update(can_use_rich_editor=True, rich_editor_requested=False)
        self.message_user(request, f'{updated} user(s) granted rich editor access.')
    approve_rich_editor_access.short_description = 'Approve rich editor access'
    
    def revoke_rich_editor_access(self, request, queryset):
        """Bulk action to revoke rich editor access"""
        updated = queryset.update(can_use_rich_editor=False)
        self.message_user(request, f'{updated} user(s) lost rich editor access.')
    revoke_rich_editor_access.short_description = 'Revoke rich editor access'
    
    def cancel_rich_editor_request(self, request, queryset):
        """Bulk action to cancel pending rich editor requests"""
        updated = queryset.update(rich_editor_requested=False, rich_editor_request_date=None)
        self.message_user(request, f'{updated} rich editor request(s) cancelled.')
    cancel_rich_editor_request.short_description = 'Cancel rich editor request'
    
    def activate_users(self, request, queryset):
        """Bulk action to activate users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) activated.')
    activate_users.short_description = 'Activate selected users'
    
    def deactivate_users(self, request, queryset):
        """Bulk action to deactivate/block users"""
        # Don't allow deactivating superusers
        superusers = queryset.filter(is_superuser=True)
        if superusers.exists():
            self.message_user(request, 'Cannot deactivate superuser accounts!', level='error')
            return
        
        # Remove all pending friend requests for these users
        from friends.models import Friendship
        from django.db.models import Q
        
        for user in queryset:
            # Delete all pending friendships where this user is involved
            Friendship.objects.filter(
                Q(from_user=user, status='pending') | Q(to_user=user, status='pending')
            ).delete()
        
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated/blocked and their pending friend requests removed.')
    deactivate_users.short_description = 'Block/Deactivate selected users'
