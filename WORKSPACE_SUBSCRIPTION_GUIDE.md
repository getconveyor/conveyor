# Workspace & Subscription Model Guide

This guide explains the complete implementation of the workspace-based subscription model for Conveyor.

## 🏗️ Architecture Overview

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ belongs to (many)
       ▼
┌──────────────────┐
│WorkspaceMember  │
└──────┬───────────┘
       │
       │ linked to
       ▼
┌──────────────────┐      ┌──────────────────┐
│   Workspace      │──────│  Subscription    │
│  (Tenant)        │ 1:1  │                  │
└──────┬───────────┘      └──────┬───────────┘
       │                         │
       │ has many                │ based on
       ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  All Resources   │      │      Plan        │
│ (Pipelines, etc) │      │   (Pricing)      │
└──────────────────┘      └──────────────────┘
```

## 📊 Database Models

### 1. **Plan** (Pricing Tiers)
```python
- Free: $0/month, 1 user, 3 pipelines, 5GB storage
- Starter: $49/month, 5 users, 10 pipelines, 50GB storage
- Professional: $149/month, 20 users, 50 pipelines, 500GB storage
- Enterprise: $499/month, unlimited everything
```

### 2. **Workspace** (Tenant)
- Multi-tenancy container
- Has owner (User)
- Has members (WorkspaceMember)
- All resources belong to a workspace

### 3. **WorkspaceMember**
- Junction table between User and Workspace
- Roles: owner, admin, member, viewer
- Status: active, invited, suspended

### 4. **Subscription**
- One-to-one with Workspace
- Links to Plan
- Status: trialing, active, past_due, cancelled, expired
- Billing cycle: monthly, yearly
- Stripe integration ready

### 5. **Invoice**
- Tracks billing history
- Status: draft, open, paid, void

## 🔄 User Flow

### Registration Flow (New User)

```
1. User registers → Creates account
                  ↓
2. Redirects to → Create Workspace page
                  ↓
3. User creates → Enters workspace name/slug
   workspace      ↓
4. Redirects to → Plan Selection page
                  ↓
5. User selects → Free (instant) OR Paid (payment)
   plan           ↓
6. If FREE     → Create subscription with 14-day trial
                  ↓
   If PAID     → Stripe Checkout → Webhook creates subscription
                  ↓
7. Redirect to → Dashboard (Workspace active!)
```

### Login Flow (Existing User)

```
1. User logs in
   ↓
2. Check workspaces
   ↓
   ├─ Has 1 workspace → Auto-select → Dashboard
   │
   ├─ Has multiple → Show workspace selector
   │
   └─ Has 0 → Redirect to Create Workspace
```

### Workspace Switcher

```
User can switch workspaces anytime:
- Dropdown in header
- Shows all workspaces user belongs to
- Switch changes context for all resources
```

## 🔐 Access Control

### Workspace-Level Permissions

```python
WORKSPACE_ROLES = {
    'owner': [
        'manage_workspace',
        'manage_billing',
        'manage_members',
        'manage_all_resources',
        'delete_workspace',
    ],
    'admin': [
        'manage_members',
        'manage_all_resources',
    ],
    'member': [
        'create_resources',
        'edit_own_resources',
        'view_all_resources',
    ],
    'viewer': [
        'view_all_resources',
    ]
}
```

### Resource Isolation

All resources are scoped to workspace:
```python
class Pipeline(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    # ... other fields

# Queries always filtered by workspace
Pipeline.objects.filter(workspace=current_workspace)
```

## 💳 Subscription Management

### Trial Period

- **Free Plan**: 14-day trial of all features
- After trial: Downgrade to free tier limits
- User can upgrade anytime

### Paid Plans

```python
# Billing Cycles
- Monthly: Charge every month
- Yearly: Charge annually (save ~15-17%)

# Payment Flow
1. User selects paid plan
2. Redirect to Stripe Checkout
3. Stripe webhook confirms payment
4. Backend creates/updates subscription
5. Workspace status → 'active'
```

### Usage Limits

```python
# Enforced at API level
def create_pipeline(workspace):
    current_count = Pipeline.objects.filter(workspace=workspace).count()
    max_allowed = workspace.subscription.plan.max_pipelines

    if current_count >= max_allowed:
        raise PermissionDenied("Pipeline limit reached. Please upgrade.")

    # Create pipeline...
```

## 🌐 API Endpoints

### Workspace Management

```
GET    /api/workspaces/                  - List user's workspaces
POST   /api/workspaces/                  - Create new workspace
GET    /api/workspaces/{id}/             - Get workspace details
PUT    /api/workspaces/{id}/             - Update workspace
DELETE /api/workspaces/{id}/             - Delete workspace (owner only)

GET    /api/workspaces/{id}/members/     - List workspace members
POST   /api/workspaces/{id}/members/     - Invite member
DELETE /api/workspaces/{id}/members/{user_id}/  - Remove member

POST   /api/workspaces/{id}/switch/      - Switch active workspace
```

### Subscription & Billing

```
GET    /api/plans/                       - List available plans
GET    /api/plans/{id}/                  - Get plan details

GET    /api/workspaces/{id}/subscription/  - Get subscription
POST   /api/workspaces/{id}/subscribe/     - Create/update subscription
POST   /api/workspaces/{id}/cancel-subscription/  - Cancel
POST   /api/workspaces/{id}/resume-subscription/  - Resume

GET    /api/workspaces/{id}/invoices/    - List invoices
GET    /api/invoices/{id}/               - Get invoice details
GET    /api/invoices/{id}/download/      - Download PDF
```

### Stripe Integration

```
POST   /api/billing/create-checkout-session/  - Start Stripe checkout
POST   /api/billing/create-portal-session/    - Customer portal
POST   /api/webhooks/stripe/                  - Stripe webhooks
```

## 🎨 Frontend Implementation

### 1. **Workspace Context** (`contexts/WorkspaceContext.tsx`)

```typescript
interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  switchWorkspace: (workspaceId: string) => void
  createWorkspace: (data: CreateWorkspaceData) => Promise<void>
  loading: boolean
}
```

### 2. **Onboarding Pages**

```
/onboarding/create-workspace  - Create first workspace
/onboarding/select-plan       - Choose subscription plan
/onboarding/payment           - Stripe checkout (paid plans)
```

### 3. **Workspace Switcher Component**

```tsx
// In header dropdown
<WorkspaceSwitcher
  current={currentWorkspace}
  workspaces={workspaces}
  onSwitch={switchWorkspace}
/>
```

### 4. **Billing Pages**

```
/settings/billing             - Manage subscription
/settings/billing/plans       - View/change plans
/settings/billing/invoices    - Invoice history
```

### 5. **Usage Indicators**

```tsx
<UsageMeter
  current={workspace.usage.pipelines}
  limit={workspace.subscription.plan.max_pipelines}
  label="Pipelines"
/>
```

## 🔄 Implementation Steps

### Backend (Django)

1. ✅ Create models (Plan, Workspace, WorkspaceMember, Subscription, Invoice)
2. ✅ Create management command to seed plans
3. ⏳ Update admin.py
4. ⏳ Create serializers for workspace/subscription
5. ⏳ Update authentication to handle workspace creation
6. ⏳ Create workspace views/viewsets
7. ⏳ Add Stripe integration
8. ⏳ Create middleware for workspace context
9. ⏳ Update all existing models to include workspace FK

### Frontend (Next.js)

1. ⏳ Create WorkspaceContext
2. ⏳ Create onboarding flow
3. ⏳ Create workspace switcher
4. ⏳ Create billing pages
5. ⏳ Add usage indicators
6. ⏳ Update API client for workspace header

## 💡 Key Considerations

### Multi-Tenancy Best Practices

1. **Data Isolation**: Always filter by workspace
2. **Row-Level Security**: PostgreSQL RLS for extra security
3. **Performance**: Index workspace_id on all tables
4. **Migrations**: Careful with existing data

### Billing Integration

1. **Stripe Setup**:
   - Create products & prices in Stripe Dashboard
   - Set up webhooks
   - Handle payment failures gracefully

2. **Webhook Events**:
   ```python
   - checkout.session.completed  → Create subscription
   - invoice.paid                → Update subscription
   - customer.subscription.updated → Sync status
   - customer.subscription.deleted → Cancel subscription
   ```

### Security

1. **Workspace Access**: Verify user membership
2. **Subscription Check**: Validate active subscription
3. **Usage Limits**: Enforce at API level
4. **Payment Security**: Never store card details

## 🚀 Quick Start

### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py seed_plans
```

### Test Flow

```bash
1. Register new user
2. Create workspace "Acme Corp"
3. Select Free plan
4. Start using with trial period
5. Invite team members
6. Upgrade to Pro when ready
```

## 📈 Future Enhancements

- [ ] Usage analytics dashboard
- [ ] Custom enterprise pricing
- [ ] Add-ons (extra storage, users)
- [ ] Team collaboration features
- [ ] Advanced governance per workspace
- [ ] White-label options for enterprise

---

## Summary

This workspace-subscription model provides:

✅ **Multi-tenancy** - Complete data isolation
✅ **Flexible Billing** - Free to Enterprise
✅ **Team Collaboration** - Member management
✅ **Usage Limits** - Automated enforcement
✅ **Stripe Integration** - Professional billing
✅ **Trial Period** - Risk-free evaluation
✅ **Upgrade Path** - Smooth growth journey

The user journey is clear:
**Register → Create Workspace → Choose Plan → Start Building!**
