# Workspace Member Management Guide

This guide explains how workspace owners and admins can invite, manage, and control member access to their workspaces.

## Table of Contents

1. [Overview](#overview)
2. [Member Roles](#member-roles)
3. [Member Statuses](#member-statuses)
4. [API Endpoints](#api-endpoints)
5. [Usage Flows](#usage-flows)
6. [Permission Requirements](#permission-requirements)
7. [Frontend Implementation](#frontend-implementation)

## Overview

The member management system enables workspace owners to:
- Invite new members to their workspace
- Assign roles with different permission levels
- Manage member status (suspend, activate, deactivate)
- Update member roles
- Remove members from the workspace
- Enforce subscription plan limits on member count

## Member Roles

Each workspace member has one of the following roles:

### Owner
- **Permissions**: Full control over the workspace
- **Can**:
  - Manage billing and subscription
  - Invite, update, suspend, deactivate members
  - Delete the workspace
  - Access all workspace features
- **Restrictions**: Cannot be suspended, deactivated, or removed

### Admin
- **Permissions**: Administrative control
- **Can**:
  - Invite, update, suspend, deactivate other members (except owner)
  - Manage workspace settings
  - Access all workspace features
- **Cannot**: Manage billing or delete workspace

### Developer
- **Permissions**: Full development access
- **Can**:
  - Create and manage pipelines
  - Configure connections
  - Access data lake and warehouse
  - Run transformations
- **Cannot**: Manage members or billing

### Analyst
- **Permissions**: Read and analyze data
- **Can**:
  - View pipelines and data
  - Run queries and create reports
  - Access analytics features
- **Cannot**: Create or modify pipelines, manage members

### Viewer
- **Permissions**: Read-only access
- **Can**:
  - View dashboards and reports
  - Browse workspace resources
- **Cannot**: Create, modify, or delete anything

## Member Statuses

Members can have the following statuses:

### Active
- Member has full access based on their role
- Can authenticate and use workspace features

### Invited
- Initial status when a member is invited
- Member receives invitation email with token
- Must accept invitation to become active
- Invitation expires after 7 days

### Suspended
- Temporarily blocked from workspace access
- Cannot authenticate or access workspace
- Can be reactivated by owner/admin
- Tracks who suspended and when

### Deactivated
- Permanently blocked from workspace access
- Cannot authenticate or access workspace
- Can be reactivated by owner/admin
- Tracks who deactivated and when

## API Endpoints

All endpoints require authentication. Base URL: `/api/auth/`

### List Workspaces

```http
GET /api/auth/workspaces/
```

Returns workspaces where user is an active member.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Workspace",
    "slug": "my-workspace",
    "description": "Description",
    "owner": "owner-uuid",
    "owner_email": "owner@example.com",
    "owner_name": "John Doe",
    "status": "active",
    "member_count": 5,
    "subscription": {
      "plan": {
        "name": "Professional",
        "max_users": 10
      },
      "status": "active"
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

### Get Workspace Members

```http
GET /api/auth/workspaces/{workspace_id}/members/
```

Returns all members of the workspace.

**Response:**
```json
[
  {
    "id": "member-uuid",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "john_doe",
      "full_name": "John Doe",
      "avatar": "https://..."
    },
    "role": "admin",
    "status": "active",
    "invited_by_email": "owner@example.com",
    "invited_at": "2023-01-01T00:00:00Z",
    "joined_at": "2023-01-01T01:00:00Z",
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

### Invite Member

```http
POST /api/auth/workspaces/{workspace_id}/invite_member/
```

**Permissions**: Owner or Admin only

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "developer",
  "message": "Optional welcome message"
}
```

**Role Choices**: `admin`, `developer`, `analyst`, `viewer`

**Response (201 Created):**
```json
{
  "detail": "Invitation sent to newuser@example.com",
  "member": {
    "id": "member-uuid",
    "user": {
      "email": "newuser@example.com",
      "username": "newuser_abc123"
    },
    "role": "developer",
    "status": "invited",
    "invitation_token": "secure-token"
  }
}
```

**Error Responses:**

403 Forbidden - Member limit reached:
```json
{
  "error": "Member limit reached. Your plan allows 10 members. Please upgrade to add more."
}
```

400 Bad Request - Already a member:
```json
{
  "email": ["User is already a member of this workspace."]
}
```

### Update Member Role

```http
PATCH /api/auth/workspaces/{workspace_id}/members/{member_id}/role/
```

**Permissions**: Owner or Admin only

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "detail": "Role updated to admin",
  "member": {
    "id": "member-uuid",
    "role": "admin",
    "status": "active"
  }
}
```

**Error Responses:**

400 Bad Request - Cannot change owner role:
```json
{
  "role": ["Cannot change the role of workspace owner."]
}
```

### Suspend Member

```http
POST /api/auth/workspaces/{workspace_id}/members/{member_id}/suspend/
```

**Permissions**: Owner or Admin only

**Response (200 OK):**
```json
{
  "detail": "user@example.com has been suspended",
  "member": {
    "id": "member-uuid",
    "status": "suspended",
    "suspended_at": "2023-06-01T12:00:00Z",
    "suspended_by_email": "admin@example.com"
  }
}
```

**Error Responses:**

403 Forbidden - Cannot suspend owner:
```json
{
  "error": "Cannot suspend workspace owner"
}
```

400 Bad Request - Already suspended:
```json
{
  "error": "Member is already suspended"
}
```

### Activate Member

```http
POST /api/auth/workspaces/{workspace_id}/members/{member_id}/activate/
```

**Permissions**: Owner or Admin only

Reactivates a suspended or deactivated member.

**Response (200 OK):**
```json
{
  "detail": "user@example.com has been activated",
  "member": {
    "id": "member-uuid",
    "status": "active",
    "suspended_at": null,
    "deactivated_at": null
  }
}
```

### Deactivate Member

```http
POST /api/auth/workspaces/{workspace_id}/members/{member_id}/deactivate/
```

**Permissions**: Owner or Admin only

**Response (200 OK):**
```json
{
  "detail": "user@example.com has been deactivated",
  "member": {
    "id": "member-uuid",
    "status": "deactivated",
    "deactivated_at": "2023-06-01T12:00:00Z",
    "deactivated_by_email": "admin@example.com"
  }
}
```

**Error Responses:**

403 Forbidden - Cannot deactivate owner:
```json
{
  "error": "Cannot deactivate workspace owner"
}
```

### Remove Member

```http
DELETE /api/auth/workspaces/{workspace_id}/members/{member_id}/
```

**Permissions**: Owner or Admin only

Permanently removes a member from the workspace.

**Response (200 OK):**
```json
{
  "detail": "user@example.com has been removed from the workspace"
}
```

**Error Responses:**

403 Forbidden - Cannot remove owner:
```json
{
  "error": "Cannot remove workspace owner"
}
```

### Get Subscription Details

```http
GET /api/auth/workspaces/{workspace_id}/subscription/
```

Returns workspace subscription and plan details.

**Response:**
```json
{
  "id": "subscription-uuid",
  "workspace": "workspace-uuid",
  "plan": {
    "name": "Professional",
    "plan_type": "professional",
    "price_monthly": "149.00",
    "max_users": 10,
    "max_pipelines": 100,
    "max_storage_gb": 500,
    "max_queries_per_day": 10000
  },
  "status": "active",
  "billing_cycle": "monthly",
  "current_period_start": "2023-06-01T00:00:00Z",
  "current_period_end": "2023-07-01T00:00:00Z"
}
```

## Usage Flows

### Inviting a New Member

1. **Owner/Admin initiates invitation**
   ```javascript
   POST /api/auth/workspaces/{workspace_id}/invite_member/
   {
     "email": "newdev@example.com",
     "role": "developer"
   }
   ```

2. **System checks member limit**
   - Counts active members
   - Compares to plan's `max_users`
   - Returns 403 if limit reached

3. **System creates member record**
   - Creates user if email doesn't exist (inactive)
   - Generates invitation token (32-byte URL-safe)
   - Sets expiration to 7 days from now
   - Sets status to 'invited'

4. **System sends invitation email** (TODO)
   - Email contains invitation link with token
   - Link: `https://app.conveyor.com/accept-invite/{token}`

5. **User accepts invitation**
   - Verifies token is valid and not expired
   - If user doesn't exist, redirects to registration with pre-filled email
   - If user exists, activates membership
   - Updates status to 'active'
   - Sets `joined_at` timestamp

### Managing Member Roles

1. **Admin wants to promote developer to admin**
   ```javascript
   PATCH /api/auth/workspaces/{workspace_id}/members/{member_id}/role/
   {
     "role": "admin"
   }
   ```

2. **System validates request**
   - Checks if requester is owner/admin
   - Ensures target member is not owner
   - Validates role choice

3. **System updates role**
   - Changes member.role
   - Saves to database
   - Returns updated member data

### Suspending a Member

**Use Case**: Temporarily block access due to policy violation or investigation

1. **Admin suspends member**
   ```javascript
   POST /api/auth/workspaces/{workspace_id}/members/{member_id}/suspend/
   ```

2. **System updates status**
   - Sets status to 'suspended'
   - Records `suspended_at` timestamp
   - Records `suspended_by` user reference

3. **Member access blocked**
   - Authentication checks member status
   - Suspended members cannot access workspace
   - API returns 403 Forbidden for workspace requests

4. **Reactivation when ready**
   ```javascript
   POST /api/auth/workspaces/{workspace_id}/members/{member_id}/activate/
   ```

### Deactivating a Member

**Use Case**: Permanently block access (former employee, contract ended)

Similar to suspension but indicates permanent removal intention. Can still be reactivated if needed.

### Removing a Member

**Use Case**: Complete removal from workspace

1. **Admin removes member**
   ```javascript
   DELETE /api/auth/workspaces/{workspace_id}/members/{member_id}/
   ```

2. **System deletes membership**
   - Permanently deletes WorkspaceMember record
   - User account remains (may be in other workspaces)
   - Cannot be undone (must re-invite)

## Permission Requirements

### Endpoint Permissions Matrix

| Endpoint | Owner | Admin | Developer | Analyst | Viewer |
|----------|-------|-------|-----------|---------|--------|
| List workspaces | ✓ | ✓ | ✓ | ✓ | ✓ |
| View members | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invite member | ✓ | ✓ | ✗ | ✗ | ✗ |
| Update role | ✓ | ✓ | ✗ | ✗ | ✗ |
| Suspend member | ✓ | ✓ | ✗ | ✗ | ✗ |
| Activate member | ✓ | ✓ | ✗ | ✗ | ✗ |
| Deactivate member | ✓ | ✓ | ✗ | ✗ | ✗ |
| Remove member | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ | ✗ | ✗ |

### Owner Protections

The owner role has special protections:
- Cannot change owner's role
- Cannot suspend owner
- Cannot deactivate owner
- Cannot remove owner
- Only owner can manage billing

To transfer ownership, a separate transfer process would be needed (not yet implemented).

## Frontend Implementation

### Member Management Page

Create a page at `/workspace/settings/members` with the following sections:

#### 1. Members List Component

```tsx
// components/workspace/MembersList.tsx
import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi } from '@/lib/api/workspace'

interface Member {
  id: string
  user: {
    email: string
    full_name: string
    avatar?: string
  }
  role: string
  status: string
  invited_at: string
  joined_at?: string
}

export function MembersList() {
  const { currentWorkspace } = useWorkspace()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [currentWorkspace])

  async function loadMembers() {
    if (!currentWorkspace) return

    try {
      const data = await workspaceApi.getMembers(currentWorkspace.id)
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Members</h2>
        <InviteMemberButton onInvited={loadMembers} />
      </div>

      <div className="border rounded-lg">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            onUpdate={loadMembers}
          />
        ))}
      </div>
    </div>
  )
}
```

#### 2. Invite Member Modal

```tsx
// components/workspace/InviteMemberModal.tsx
import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { workspaceApi } from '@/lib/api/workspace'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onInvited: () => void
}

export function InviteMemberModal({ isOpen, onClose, onInvited }: InviteMemberModalProps) {
  const { currentWorkspace } = useWorkspace()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!currentWorkspace) return

    setLoading(true)
    setError('')

    try {
      await workspaceApi.inviteMember(currentWorkspace.id, { email, role })
      onInvited()
      onClose()
      setEmail('')
      setRole('viewer')
    } catch (err: any) {
      setError(err.message || 'Failed to invite member')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal">
      <form onSubmit={handleInvite}>
        <h3>Invite Member</h3>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
          <option value="analyst">Analyst</option>
          <option value="viewer">Viewer</option>
        </select>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Inviting...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  )
}
```

#### 3. Member Row Component

```tsx
// components/workspace/MemberRow.tsx
import { useState } from 'react'
import { workspaceApi } from '@/lib/api/workspace'
import { useAuth } from '@/contexts/AuthContext'

export function MemberRow({ member, onUpdate }) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const canManage = member.role !== 'owner' && user?.role in ['owner', 'admin']

  async function handleRoleChange(newRole: string) {
    setIsUpdating(true)
    try {
      await workspaceApi.updateMemberRole(workspaceId, member.id, newRole)
      onUpdate()
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleSuspend() {
    setIsUpdating(true)
    try {
      await workspaceApi.suspendMember(workspaceId, member.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to suspend member:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleActivate() {
    setIsUpdating(true)
    try {
      await workspaceApi.activateMember(workspaceId, member.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to activate member:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <img
          src={member.user.avatar || '/default-avatar.png'}
          alt={member.user.full_name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <div className="font-medium">{member.user.full_name}</div>
          <div className="text-sm text-gray-500">{member.user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <MemberStatusBadge status={member.status} />

        {canManage && (
          <select
            value={member.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isUpdating}
          >
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
        )}

        {canManage && member.status === 'active' && (
          <button onClick={handleSuspend} disabled={isUpdating}>
            Suspend
          </button>
        )}

        {canManage && member.status === 'suspended' && (
          <button onClick={handleActivate} disabled={isUpdating}>
            Activate
          </button>
        )}
      </div>
    </div>
  )
}
```

#### 4. Workspace API Client

```typescript
// lib/api/workspace.ts
import { apiClient } from './client'

export interface InviteMemberData {
  email: string
  role: 'admin' | 'developer' | 'analyst' | 'viewer'
  message?: string
}

export const workspaceApi = {
  async getMembers(workspaceId: string) {
    return apiClient.get(`/auth/workspaces/${workspaceId}/members/`)
  },

  async inviteMember(workspaceId: string, data: InviteMemberData) {
    return apiClient.post(`/auth/workspaces/${workspaceId}/invite_member/`, data)
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return apiClient.patch(
      `/auth/workspaces/${workspaceId}/members/${memberId}/role/`,
      { role }
    )
  },

  async suspendMember(workspaceId: string, memberId: string) {
    return apiClient.post(
      `/auth/workspaces/${workspaceId}/members/${memberId}/suspend/`
    )
  },

  async activateMember(workspaceId: string, memberId: string) {
    return apiClient.post(
      `/auth/workspaces/${workspaceId}/members/${memberId}/activate/`
    )
  },

  async deactivateMember(workspaceId: string, memberId: string) {
    return apiClient.post(
      `/auth/workspaces/${workspaceId}/members/${memberId}/deactivate/`
    )
  },

  async removeMember(workspaceId: string, memberId: string) {
    return apiClient.delete(
      `/auth/workspaces/${workspaceId}/members/${memberId}/`
    )
  },
}
```

### Usage Limit Indicator

Display subscription limits on the members page:

```tsx
// components/workspace/MemberLimitIndicator.tsx
export function MemberLimitIndicator({ workspace }) {
  const { subscription } = workspace
  const activeMemberCount = workspace.member_count
  const maxMembers = subscription.plan.max_users
  const percentUsed = (activeMemberCount / maxMembers) * 100

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Team Members</span>
        <span className="text-sm text-gray-600">
          {activeMemberCount} / {maxMembers} used
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            percentUsed >= 90 ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {percentUsed >= 90 && (
        <p className="text-sm text-red-600 mt-2">
          You're approaching your member limit. Consider upgrading your plan.
        </p>
      )}
    </div>
  )
}
```

## Next Steps

1. **Run migrations** to create the database tables:
   ```bash
   cd conveyor-server
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Seed subscription plans**:
   ```bash
   python manage.py seed_plans
   ```

3. **Test the API** using tools like Postman or cURL

4. **Implement frontend components** as outlined above

5. **Implement invitation email sending** (integrate SendGrid, AWS SES, or similar)

6. **Create invitation acceptance flow** with token verification

7. **Add audit logging** for member management actions

8. **Implement real-time notifications** when members are added/removed
