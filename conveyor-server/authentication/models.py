from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid


class User(AbstractUser):
    """Extended User model based on BACKEND_SPECIFICATIONS.md"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    avatar = models.URLField(blank=True, null=True)

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('developer', 'Developer'),
        ('analyst', 'Analyst'),
        ('viewer', 'Viewer'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='viewer')

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')

    preferences = models.JSONField(default=dict, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class Plan(models.Model):
    """Subscription plan model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()

    PLAN_TYPE_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]
    plan_type = models.CharField(max_length=50, choices=PLAN_TYPE_CHOICES, unique=True)

    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Features/Limits
    max_users = models.IntegerField(default=1)
    max_pipelines = models.IntegerField(default=5)
    max_storage_gb = models.IntegerField(default=10)
    max_queries_per_day = models.IntegerField(default=100)

    features = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plans'
        ordering = ['price_monthly']

    def __str__(self):
        return f"{self.name} - ${self.price_monthly}/month"


class Workspace(models.Model):
    """Workspace/Tenant model for multi-tenancy"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('trial', 'Trial'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='trial')

    # Settings
    settings = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workspaces'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_active(self):
        return self.status in ['active', 'trial']


class WorkspaceMember(models.Model):
    """Workspace membership model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspace_memberships')

    # Align roles with User model for consistency
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('developer', 'Developer'),
        ('analyst', 'Analyst'),
        ('viewer', 'Viewer'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='viewer')

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('invited', 'Invited'),
        ('suspended', 'Suspended'),
        ('deactivated', 'Deactivated'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='invited')

    # Invitation tracking
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invited_members')
    invited_at = models.DateTimeField(auto_now_add=True)
    invitation_token = models.CharField(max_length=255, blank=True, null=True, unique=True)
    invitation_expires_at = models.DateTimeField(null=True, blank=True)

    joined_at = models.DateTimeField(null=True, blank=True)

    # Status change tracking
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspended_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspended_members')
    deactivated_at = models.DateTimeField(null=True, blank=True)
    deactivated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deactivated_members')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'workspace_members'
        unique_together = ['workspace', 'user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} ({self.role}) in {self.workspace.name}"

    @property
    def is_active(self):
        return self.status == 'active'

    @property
    def is_owner(self):
        return self.role == 'owner'

    @property
    def can_manage_members(self):
        """Check if member can manage other members"""
        return self.role in ['owner', 'admin']

    @property
    def can_manage_billing(self):
        """Only owners can manage billing"""
        return self.role == 'owner'


class Subscription(models.Model):
    """Subscription model for workspace billing"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.OneToOneField(Workspace, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')

    STATUS_CHOICES = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='trialing')

    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    billing_cycle = models.CharField(max_length=50, choices=BILLING_CYCLE_CHOICES, default='monthly')

    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()

    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)

    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Payment info (Stripe, etc.)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)

    # Usage tracking
    usage_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.workspace.name} - {self.plan.name}"

    @property
    def is_active(self):
        return self.status in ['trialing', 'active']

    @property
    def is_trial(self):
        return self.status == 'trialing'


class Invoice(models.Model):
    """Invoice model for billing"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='invoices')

    invoice_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('uncollectible', 'Uncollectible'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='open')

    due_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)

    stripe_invoice_id = models.CharField(max_length=255, blank=True, null=True)

    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.subscription.workspace.name}"


class Session(models.Model):
    """User session model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    token = models.TextField()
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Session for {self.user.email}"


class ApiKey(models.Model):
    """API Key model for programmatic access"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    key_hash = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='api_keys', null=True, blank=True)
    permissions = models.JSONField(default=list, blank=True)
    last_used = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_keys'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.user.email}"
