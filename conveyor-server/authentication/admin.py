from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Session, ApiKey, Plan, Workspace, WorkspaceMember, Subscription, Invoice


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


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    """Admin interface for Plan model"""

    list_display = ['name', 'plan_type', 'price_monthly', 'price_yearly', 'max_users', 'is_active']
    list_filter = ['plan_type', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['price_monthly']
    readonly_fields = ['created_at', 'updated_at']


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


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for Subscription model"""

    list_display = ['workspace', 'plan', 'status', 'billing_cycle', 'current_period_end']
    list_filter = ['status', 'billing_cycle', 'plan']
    search_fields = ['workspace__name', 'stripe_subscription_id', 'stripe_customer_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for Invoice model"""

    list_display = ['invoice_number', 'subscription', 'amount', 'status', 'due_date', 'paid_at']
    list_filter = ['status', 'created_at', 'due_date']
    search_fields = ['invoice_number', 'subscription__workspace__name', 'stripe_invoice_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
