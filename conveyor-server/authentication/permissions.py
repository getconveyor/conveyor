from rest_framework import permissions
from .models import WorkspaceMember


class IsWorkspaceOwner(permissions.BasePermission):
    """
    Permission check for workspace owner only
    """

    message = "Only workspace owners can perform this action."

    def has_object_permission(self, request, view, obj):
        """Check if user is the workspace owner"""
        # obj is the workspace
        try:
            membership = WorkspaceMember.objects.get(
                workspace=obj,
                user=request.user,
                status='active'
            )
            return membership.role == 'owner'
        except WorkspaceMember.DoesNotExist:
            return False


class IsWorkspaceOwnerOrAdmin(permissions.BasePermission):
    """
    Permission check for workspace owner or admin
    """

    message = "Only workspace owners or admins can perform this action."

    def has_object_permission(self, request, view, obj):
        """Check if user is owner or admin of the workspace"""
        # obj is the workspace
        try:
            membership = WorkspaceMember.objects.get(
                workspace=obj,
                user=request.user,
                status='active'
            )
            return membership.role in ['owner', 'admin']
        except WorkspaceMember.DoesNotExist:
            return False


class IsWorkspaceMember(permissions.BasePermission):
    """
    Permission check for any active workspace member
    """

    message = "You must be a member of this workspace to access it."

    def has_object_permission(self, request, view, obj):
        """Check if user is an active member of the workspace"""
        # obj could be a Workspace or a workspace-scoped object (Source, Pipeline, etc.)
        workspace = obj if hasattr(obj, '__class__') and obj.__class__.__name__ == 'Workspace' else getattr(obj, 'workspace', None)
        
        if not workspace:
            return False
            
        try:
            membership = WorkspaceMember.objects.get(
                workspace=workspace,
                user=request.user,
                status='active'
            )
            return True
        except WorkspaceMember.DoesNotExist:
            return False


class HasWorkspaceRole(permissions.BasePermission):
    """
    Permission check for specific workspace roles
    Usage: Add to view with required_roles attribute
    """

    message = "You don't have sufficient permissions in this workspace."

    def has_object_permission(self, request, view, obj):
        """Check if user has required role in workspace"""
        required_roles = getattr(view, 'required_roles', [])

        if not required_roles:
            return True

        try:
            membership = WorkspaceMember.objects.get(
                workspace=obj,
                user=request.user,
                status='active'
            )
            return membership.role in required_roles
        except WorkspaceMember.DoesNotExist:
            return False
