# Authentication Features - Gap Analysis

Comparison of Django backend authentication features with frontend implementation.

## ✅ Fully Implemented Features

| Feature | Backend Endpoint | Frontend Implementation |
|---------|-----------------|------------------------|
| User Registration | `POST /auth/register/` | `/app/(auth)/register/page.tsx` |
| User Login | `POST /auth/login/` | `/app/(auth)/login/page.tsx` |
| User Logout | `POST /auth/logout/` | `AuthContext.logout()` |
| List Workspaces | `GET /workspaces/` | `workspaceApi.getWorkspaces()` |
| Get Workspace Members | `GET /workspaces/{id}/members/` | `workspaceApi.getMembers()` |
| Invite Member | `POST /workspaces/{id}/invite_member/` | `InviteMemberModal` |
| Update Member Role | `PATCH /workspaces/{id}/members/{member_id}/role/` | `MemberRow` role dropdown |
| Suspend Member | `POST /workspaces/{id}/members/{member_id}/suspend/` | `MemberRow` actions menu |
| Activate Member | `POST /workspaces/{id}/members/{member_id}/activate/` | `MemberRow` actions menu |
| Deactivate Member | `POST /workspaces/{id}/members/{member_id}/deactivate/` | `MemberRow` actions menu |
| Remove Member | `DELETE /workspaces/{id}/members/{member_id}/` | `MemberRow` actions menu |
| Get Subscription | `GET /workspaces/{id}/subscription/` | `workspaceApi.getSubscription()` |
| Switch Workspace | `POST /workspaces/switch/` | `workspaceApi.switchWorkspace()` |

## ❌ Missing Frontend Implementation

### 1. User Profile Management

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `GET /users/me/` | Get current user profile | **HIGH** | ❌ Not Implemented |
| `PUT /users/update_profile/` | Update user profile | **HIGH** | ❌ Not Implemented |
| `PATCH /users/update_profile/` | Partial profile update | **HIGH** | ❌ Not Implemented |

**What's Missing:**
- Profile view page
- Edit profile form
- Avatar upload
- Name updates
- Profile API client methods

**Use Cases:**
- User wants to view their profile
- User wants to update their name
- User wants to change their avatar
- User wants to see their account details

---

### 2. Password Management

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `POST /users/change_password/` | Change user password | **HIGH** | ❌ Not Implemented |

**What's Missing:**
- Change password page/modal
- Old password verification
- New password confirmation
- Password strength indicator

**Use Cases:**
- User wants to change password
- Security best practice to rotate passwords
- User suspects account compromise

---

### 3. User Preferences

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `GET /users/preferences/` | Get user preferences | **MEDIUM** | ❌ Not Implemented |
| `PUT /users/update_preferences/` | Update preferences | **MEDIUM** | ❌ Not Implemented |
| `PATCH /users/update_preferences/` | Partial preference update | **MEDIUM** | ❌ Not Implemented |

**What's Missing:**
- Preferences management page
- Theme selection (dark/light mode)
- Notification settings
- Language preferences
- Timezone settings

**Use Cases:**
- User wants to customize their experience
- User wants to set notification preferences
- User wants dark mode

---

### 4. API Key Management

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `GET /api-keys/` | List user's API keys | **MEDIUM** | ❌ Not Implemented |
| `POST /api-keys/` | Create new API key | **MEDIUM** | ❌ Not Implemented |
| `GET /api-keys/{id}/` | Get API key details | **MEDIUM** | ❌ Not Implemented |
| `PUT /api-keys/{id}/` | Update API key | **MEDIUM** | ❌ Not Implemented |
| `DELETE /api-keys/{id}/` | Delete API key | **MEDIUM** | ❌ Not Implemented |

**What's Missing:**
- API keys list page
- Create API key modal
- Display key once after creation
- Copy to clipboard functionality
- Key permissions management
- Key expiration dates
- Last used tracking

**Use Cases:**
- Developer wants programmatic API access
- User wants to integrate with third-party tools
- User wants to automate pipeline creation
- User needs to revoke compromised key

---

### 5. Subscription Plans

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `GET /plans/` | List available plans | **HIGH** | ❌ Not Implemented |
| `GET /plans/{id}/` | Get plan details | **HIGH** | ❌ Not Implemented |

**What's Missing:**
- Plans listing page
- Plan comparison table
- Plan selection UI
- Pricing display
- Feature comparison

**Use Cases:**
- User wants to see available plans
- User wants to compare plan features
- User needs to know pricing
- User preparing to create workspace

---

### 6. Workspace Creation

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `POST /workspaces/` | Create new workspace | **HIGH** | ❌ Not Implemented |

**What's Missing:**
- Create workspace page/modal
- Workspace name input
- Slug generation/validation
- Plan selection
- Description field
- Onboarding flow after registration

**Use Cases:**
- New user wants to create their first workspace
- Existing user wants additional workspace
- User wants to separate projects

---

### 7. Workspace Settings

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `GET /workspaces/{id}/` | Get workspace details | **MEDIUM** | ❌ Not Implemented |
| `PUT /workspaces/{id}/` | Update workspace | **MEDIUM** | ❌ Not Implemented |
| `PATCH /workspaces/{id}/` | Partial workspace update | **MEDIUM** | ❌ Not Implemented |
| `DELETE /workspaces/{id}/` | Delete workspace | **LOW** | ❌ Not Implemented |

**What's Missing:**
- Workspace general settings page
- Update workspace name
- Update workspace description
- Workspace slug management
- Workspace settings JSON editor
- Delete workspace with confirmation

**Use Cases:**
- User wants to rename workspace
- User wants to update description
- User wants to delete unused workspace
- User wants to configure workspace settings

---

### 8. Workspace Switcher

| Backend Endpoint | Purpose | Priority | Status |
|-----------------|---------|----------|--------|
| `POST /workspaces/switch/` | Switch active workspace | **HIGH** | ⚠️ Partially Implemented |

**What's Missing:**
- Workspace switcher dropdown in header
- Current workspace indicator
- Quick switch between workspaces
- Visual workspace selector

**Use Cases:**
- User has multiple workspaces
- User wants to switch between projects
- User needs quick access to different workspaces

---

## Implementation Priority

### Phase 1: Essential User Features (HIGH Priority)
1. **User Profile Management** - Users need to manage their profiles
2. **Change Password** - Security essential
3. **Workspace Creation** - Required for onboarding
4. **Plan Selection** - Required for workspace creation
5. **Workspace Switcher** - Required for multi-workspace users

### Phase 2: Workspace Management (MEDIUM Priority)
6. **Workspace Settings** - Update workspace details
7. **API Key Management** - Enable programmatic access
8. **User Preferences** - Enhance user experience

### Phase 3: Advanced Features (LOW Priority)
9. **Delete Workspace** - Administrative cleanup
10. **Advanced Preferences** - Theme, notifications, etc.

---

## Recommended Implementation Order

### 1️⃣ First: Core User Management
```
✅ Update auth API client
✅ Create user profile page
✅ Create change password modal
✅ Add profile link to header
```

### 2️⃣ Second: Workspace Onboarding
```
✅ Create plans page
✅ Create workspace creation flow
✅ Add onboarding after registration
✅ Implement workspace switcher
```

### 3️⃣ Third: Workspace Administration
```
✅ Create workspace settings page
✅ Add workspace update form
✅ Add workspace delete option
```

### 4️⃣ Fourth: Developer Tools
```
✅ Create API keys page
✅ Create API key creation modal
✅ Add copy-to-clipboard
✅ Display last used and expiration
```

### 5️⃣ Fifth: User Experience
```
✅ Create preferences page
✅ Add theme selector
✅ Add notification preferences
```

---

## Technical Debt / Known Issues

1. **Email Invitations Not Sent**
   - Backend has TODO for email sending
   - Need to integrate SendGrid/SES
   - Create email templates

2. **Invitation Acceptance Flow**
   - No page to accept workspace invitations
   - Need token verification
   - Need invitation link handling

3. **Token Refresh Logic**
   - AuthContext has refreshToken method
   - Not automatically called on 401 errors
   - Should implement automatic token refresh

4. **Error Handling**
   - Generic error messages in some places
   - Need consistent error display pattern
   - Should map backend errors to user-friendly messages

5. **Loading States**
   - Some components missing skeleton states
   - Need consistent loading UX

6. **Form Validation**
   - Client-side validation basic
   - Should add real-time validation feedback
   - Field-level error display

---

## Files to Create/Modify

### New Files Needed

**API Clients:**
- ✅ `lib/api/user.ts` - User profile and preferences
- ✅ `lib/api/apikey.ts` - API key management

**Pages:**
- ✅ `app/(platform)/settings/profile/page.tsx` - User profile
- ✅ `app/(platform)/settings/security/page.tsx` - Password & security
- ✅ `app/(platform)/settings/preferences/page.tsx` - User preferences
- ✅ `app/(platform)/settings/api-keys/page.tsx` - API key management
- ✅ `app/(platform)/workspace/settings/general/page.tsx` - Workspace settings
- ✅ `app/(platform)/onboarding/create-workspace/page.tsx` - Workspace creation
- ✅ `app/(platform)/onboarding/select-plan/page.tsx` - Plan selection

**Components:**
- ✅ `components/user/change-password-modal.tsx`
- ✅ `components/user/profile-form.tsx`
- ✅ `components/workspace/workspace-switcher.tsx`
- ✅ `components/workspace/create-workspace-modal.tsx`
- ✅ `components/workspace/delete-workspace-dialog.tsx`
- ✅ `components/workspace/plan-card.tsx`
- ✅ `components/apikey/api-key-create-modal.tsx`
- ✅ `components/apikey/api-key-row.tsx`

### Files to Modify

- ✅ `lib/api/auth.ts` - Add user profile methods
- ✅ `lib/api/workspace.ts` - Add create/update workspace methods
- ✅ `contexts/AuthContext.tsx` - Add profile refresh
- ✅ `components/site-header.tsx` - Add profile menu & workspace switcher

---

## Estimated Effort

| Feature | Complexity | Estimated Time |
|---------|-----------|----------------|
| User Profile | Medium | 2-3 hours |
| Change Password | Low | 1 hour |
| Workspace Creation | Medium | 2-3 hours |
| Plan Selection | Low | 1-2 hours |
| Workspace Switcher | Low | 1-2 hours |
| Workspace Settings | Medium | 2 hours |
| API Key Management | Medium | 2-3 hours |
| User Preferences | Medium | 2 hours |
| **Total** | | **~15-20 hours** |

---

## Success Criteria

Feature implementation is complete when:

- ✅ All backend endpoints have corresponding frontend UI
- ✅ User can perform all actions available in API
- ✅ Proper error handling and validation
- ✅ Loading states for all async operations
- ✅ Toast notifications for all actions
- ✅ Responsive design for mobile
- ✅ TypeScript types for all API calls
- ✅ Consistent UI/UX patterns
- ✅ Documentation updated

---

## Next Steps

Start with **Phase 1 (Essential User Features)** in this order:

1. Extend auth API client with user profile methods
2. Create user profile page
3. Create change password modal
4. Create plans listing page
5. Create workspace creation flow
6. Implement workspace switcher in header

This will give users complete control over their accounts and enable proper workspace management.
