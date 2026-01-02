from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Session, ApiKey, Workspace, WorkspaceMember


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model"""

    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'status', 'created_at']
    list_filter = ['role', 'status', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Permissions', {'fields': ('role', 'status', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Additional Info', {'fields': ('preferences', 'last_login', 'created_at', 'updated_at')}),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login']

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'password1', 'password2', 'role', 'status'),
        }),
    )


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    """Admin interface for Session model"""

    list_display = ['user', 'ip_address', 'expires_at', 'created_at']
    list_filter = ['created_at', 'expires_at']
    search_fields = ['user__email', 'user__username', 'ip_address']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    """Admin interface for ApiKey model"""

    list_display = ['name', 'user', 'workspace', 'last_used', 'expires_at', 'created_at']
    list_filter = ['created_at', 'expires_at', 'last_used']
    search_fields = ['name', 'user__email', 'user__username', 'workspace__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'last_used']


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    """Admin interface for Workspace model"""

    list_display = ['name', 'slug', 'owner', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'slug', 'owner__email']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    """Admin interface for WorkspaceMember model"""

    list_display = ['user', 'workspace', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status', 'created_at']
    search_fields = ['user__email', 'workspace__name']
    ordering = ['-created_at']
    readonly_fields = ['invited_at', 'created_at', 'updated_at']


