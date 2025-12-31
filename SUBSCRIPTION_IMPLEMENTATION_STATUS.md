# Subscription & Workspace Implementation Status

## ✅ Completed

### Backend Models & Database

1. **Models Created** (`authentication/models.py`)
   - ✅ `Plan` - Subscription tiers (Free, Starter, Pro, Enterprise)
   - ✅ `Workspace` - Multi-tenant workspaces
   - ✅ `WorkspaceMember` - User-workspace relationships
   - ✅ `Subscription` - Workspace billing
   - ✅ `Invoice` - Billing history
   - ✅ Updated `Session` and `ApiKey` to include workspace

2. **Management Commands**
   - ✅ `seed_plans` - Seeds 4 subscription plans with features

3. **Admin Interface**
   - ✅ All new models registered in Django admin
   - ✅ Proper list displays, filters, and search

4. **Documentation**
   - ✅ `WORKSPACE_SUBSCRIPTION_GUIDE.md` - Complete architecture guide
   - ✅ User flows, API endpoints, implementation steps

## 🔄 Next Steps

### 1. Run Migrations (REQUIRED)

```bash
cd conveyor-server

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Seed subscription plans
python manage.py seed_plans
```

### 2. Backend Implementation

#### A. Create Workspace Serializers
```python
# authentication/serializers.py

class PlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans"""
    class Meta:
        model = Plan
        fields = '__all__'

class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for workspaces"""
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'slug', 'description', 'status', ...]

class WorkspaceCreateSerializer(serializers.ModelSerializer):
    """Create workspace with trial subscription"""
    plan_id = serializers.UUIDField(required=True)

    def create(self, validated_data):
        # Create workspace
        # Add owner as member
        # Create trial subscription
        pass

class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions"""
    plan = PlanSerializer(read_only=True)
    class Meta:
        model = Subscription
        fields = '__all__'
```

#### B. Create Workspace Views
```python
# authentication/views.py

class WorkspaceViewSet(viewsets.ModelViewSet):
    """Workspace CRUD operations"""

    def get_queryset(self):
        # Return workspaces user belongs to
        return Workspace.objects.filter(
            members__user=self.request.user,
            members__status='active'
        )

    @action(detail=False, methods=['post'])
    def switch(self, request):
        """Switch active workspace"""
        workspace_id = request.data.get('workspace_id')
        # Update session/context
        pass

class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """List available plans"""
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]  # Public
```

#### C. Update Registration Flow
```python
# authentication/views.py - RegisterView

class RegisterView(APIView):
    def post(self, request):
        # 1. Create user
        user = serializer.save()

        # 2. Create default workspace (optional)
        # OR redirect to workspace creation page

        # 3. Generate tokens
        tokens = generate_tokens(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'needs_workspace': True,  # Frontend flag
        })
```

#### D. Add Workspace URLs
```python
# authentication/urls.py

router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'plans', PlanViewSet, basename='plan')

urlpatterns = [
    # ... existing patterns
    path('', include(router.urls)),
]
```

### 3. Frontend Implementation

#### A. Create Workspace Context
```typescript
// contexts/WorkspaceContext.tsx

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  subscription: Subscription | null
  switchWorkspace: (id: string) => Promise<void>
  createWorkspace: (data: CreateWorkspaceData) => Promise<void>
  loading: boolean
}

export function WorkspaceProvider({ children }) {
  // Fetch workspaces on mount
  // Provide workspace switching logic
  // Store current workspace in localStorage
}
```

#### B. Create Onboarding Flow
```tsx
// app/onboarding/create-workspace/page.tsx
- Form to create workspace (name, slug)
- Call API to create workspace
- Redirect to plan selection

// app/onboarding/select-plan/page.tsx
- Display 4 plans (Free, Starter, Pro, Enterprise)
- Free: Instant activation
- Paid: Redirect to Stripe Checkout

// app/onboarding/success/page.tsx
- Welcome message
- Redirect to dashboard
```

#### C. Update Auth Flow
```typescript
// contexts/AuthContext.tsx

const register = async (data) => {
  const response = await authService.register(data)

  if (response.needs_workspace) {
    router.push('/onboarding/create-workspace')
  } else {
    router.push('/dashboard')
  }
}

const login = async (data) => {
  const response = await authService.login(data)

  // Check if user has workspaces
  const workspaces = await workspaceService.getWorkspaces(response.tokens.access)

  if (workspaces.length === 0) {
    router.push('/onboarding/create-workspace')
  } else if (workspaces.length === 1) {
    // Auto-select single workspace
    await workspaceService.switchWorkspace(workspaces[0].id)
    router.push('/dashboard')
  } else {
    // Show workspace selector
    router.push('/select-workspace')
  }
}
```

#### D. Create Workspace Switcher
```tsx
// components/workspace/WorkspaceSwitcher.tsx

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {currentWorkspace.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {workspaces.map(ws => (
          <DropdownMenuItem onClick={() => switchWorkspace(ws.id)}>
            {ws.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PlusIcon /> Create Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Add to site-header.tsx
```

#### E. Create Billing Pages
```tsx
// app/(platform)/settings/billing/page.tsx
- Display current plan
- Show usage (pipelines, users, storage)
- "Upgrade" or "Manage Subscription" buttons

// app/(platform)/settings/billing/plans/page.tsx
- Display all plans
- Compare features
- Upgrade/downgrade buttons

// app/(platform)/settings/billing/invoices/page.tsx
- List all invoices
- Download PDF links
```

#### F. Add Usage Indicators
```tsx
// components/workspace/UsageMeter.tsx

export function UsageMeter({ label, current, limit }) {
  const percentage = (current / limit) * 100

  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{current} / {limit}</span>
      </div>
      <Progress value={percentage} />
      {percentage > 90 && (
        <Alert>You're approaching your {label} limit</Alert>
      )}
    </div>
  )
}
```

### 4. Stripe Integration (Optional - Phase 2)

```typescript
// Backend
- Install stripe: pip install stripe
- Add webhook endpoint
- Handle payment events

// Frontend
- Install @stripe/stripe-js
- Create checkout flow
- Handle success/cancel redirects
```

### 5. Middleware for Workspace Context

```python
# conveyor_server/middleware.py

class WorkspaceMiddleware:
    """Add workspace to request context"""

    def __call__(self, request):
        if request.user.is_authenticated:
            # Get workspace from header or session
            workspace_id = request.headers.get('X-Workspace-ID')

            # Verify user has access
            try:
                membership = WorkspaceMember.objects.get(
                    user=request.user,
                    workspace_id=workspace_id,
                    status='active'
                )
                request.workspace = membership.workspace
                request.workspace_role = membership.role
            except WorkspaceMember.DoesNotExist:
                request.workspace = None

        return self.get_response(request)
```

### 6. Update Existing Models

For all existing models (Pipeline, Connection, etc.):

```python
# Example: integration/models.py

class Pipeline(models.Model):
    # Add workspace field
    workspace = models.ForeignKey(
        'authentication.Workspace',
        on_delete=models.CASCADE,
        related_name='pipelines'
    )

    # ... existing fields
```

Run migrations after adding workspace fields.

## 📋 Implementation Checklist

### Phase 1: Core Workspace (Week 1)
- [ ] Run migrations
- [ ] Seed plans
- [ ] Create serializers
- [ ] Create views
- [ ] Update URLs
- [ ] Test with Postman/curl

### Phase 2: Frontend Onboarding (Week 2)
- [ ] WorkspaceContext
- [ ] Create workspace page
- [ ] Plan selection page
- [ ] Workspace switcher
- [ ] Update auth flow

### Phase 3: Billing UI (Week 3)
- [ ] Billing dashboard
- [ ] Usage indicators
- [ ] Invoice list
- [ ] Plan comparison page

### Phase 4: Stripe Integration (Week 4)
- [ ] Stripe setup
- [ ] Checkout flow
- [ ] Webhook handling
- [ ] Customer portal

### Phase 5: Migration (Week 5)
- [ ] Add workspace to existing models
- [ ] Data migration scripts
- [ ] Update all API endpoints
- [ ] Add workspace filtering

## 🎯 Quick Start (Minimal Viable Implementation)

To get started quickly with basic functionality:

1. **Backend Minimal**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py seed_plans
   ```

2. **Frontend Minimal**
   - After registration → Show "Create Workspace" modal
   - Auto-select Free plan
   - Create workspace + subscription
   - Redirect to dashboard

3. **Test Flow**
   ```
   Register → Create Workspace "My Workspace" → Select Free → Dashboard
   ```

## 🔗 Related Documentation

- `WORKSPACE_SUBSCRIPTION_GUIDE.md` - Complete architecture guide
- `BACKEND_SPECIFICATIONS.md` - Original backend specs
- `DOCKER_SETUP.md` - Docker configuration

## 💡 Key Notes

1. **Trial Period**: Free plans get 14 days of all features
2. **Workspace Isolation**: All data scoped to workspace
3. **Billing Cycle**: Monthly or yearly (yearly saves ~15%)
4. **Usage Limits**: Enforced at API level
5. **Team Size**: Based on plan tier

## 🎉 What You Have Now

✅ Complete database schema for multi-tenancy
✅ Subscription plans with feature flags
✅ Ready for Stripe integration
✅ Workspace member management
✅ Invoice tracking
✅ Admin interface for all models

## 🚀 What's Next

The system is architecturally complete! Now you need to:

1. **Run migrations** to create tables
2. **Implement serializers & views** for API
3. **Build frontend onboarding** flow
4. **Add Stripe** when ready for payments

**Estimated Time**: 2-3 weeks for full implementation
**MVP**: 3-4 days for basic workspace creation + free plan
