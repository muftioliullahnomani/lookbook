from django.contrib import admin
from .models import Group, GroupMember

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'privacy', 'created_by', 'created_at']
    list_filter = ['privacy', 'created_at']
    search_fields = ['name', 'description']

@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['user__username', 'group__name']
