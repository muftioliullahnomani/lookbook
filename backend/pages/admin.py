from django.contrib import admin
from .models import Page, PageFollower, PageAdmin as PageAdminModel

@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'username', 'owner', 'category', 'is_verified', 'created_at']
    list_filter = ['category', 'is_verified', 'created_at']
    search_fields = ['name', 'username', 'owner__username', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(PageFollower)
class PageFollowerAdmin(admin.ModelAdmin):
    list_display = ['id', 'page', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['page__name', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']

@admin.register(PageAdminModel)
class PageAdminRoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'page', 'user', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['page__name', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
