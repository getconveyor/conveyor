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
    Permission check for any active workspace member.
    Checks workspace from X-Workspace-ID header or object's workspace.
    """

    message = "You must be a member of this workspace to access it."

    def has_permission(self, request, view):
        """Check if user is an active member via X-Workspace-ID header"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.warning(f"IsWorkspaceMember.has_permission: user={request.user}, is_authenticated={request.user.is_authenticated if request.user else False}")
        
        if not request.user or not request.user.is_authenticated:
            logger.warning("IsWorkspaceMember: User not authenticated")
            return False
            
        workspace_id = request.headers.get('X-Workspace-ID')
        logger.warning(f"IsWorkspaceMember: workspace_id from header = {workspace_id}, user_id = {request.user.id}")
        
        if not workspace_id:
            # No workspace header - defer to has_object_permission
            return True
            
        try:
            membership = WorkspaceMember.objects.get(
                workspace_id=workspace_id,
                user=request.user,
                status='active'
            )
            logger.warning(f"IsWorkspaceMember: Found membership, role={membership.role}")
            return True
        except WorkspaceMember.DoesNotExist:
            logger.warning(f"IsWorkspaceMember: No membership found for user {request.user.id} in workspace {workspace_id}")
            return False

    def has_object_permission(self, request, view, obj):
        """Check if user is an active member of the workspace"""
        import logging
        logger = logging.getLogger(__name__)
        
        # obj could be a Workspace or a workspace-scoped object (Source, Pipeline, etc.)
        workspace = obj if hasattr(obj, '__class__') and obj.__class__.__name__ == 'Workspace' else getattr(obj, 'workspace', None)
        workspace_id = None
        
        # Also check workspace_id for models that use UUID field instead of FK
        if not workspace:
            workspace_id = getattr(obj, 'workspace_id', None)
        
        # Check for nested relationships like PipelineRun.pipeline.workspace
        if not workspace and not workspace_id:
            # Check if object has a 'pipeline' attribute (for PipelineRun)
            if hasattr(obj, 'pipeline') and obj.pipeline:
                workspace = getattr(obj.pipeline, 'workspace', None)
                workspace_id = getattr(obj.pipeline, 'workspace_id', None)
        
        logger.warning(f"IsWorkspaceMember.has_object_permission: obj={obj.__class__.__name__}, workspace={workspace}, workspace_id={workspace_id}")
        
        if workspace_id:
            try:
                membership = WorkspaceMember.objects.get(
                    workspace_id=workspace_id,
                    user=request.user,
                    status='active'
                )
                logger.warning(f"IsWorkspaceMember.has_object_permission: Found membership by workspace_id")
                return True
            except WorkspaceMember.DoesNotExist:
                logger.warning(f"IsWorkspaceMember.has_object_permission: No membership for workspace_id {workspace_id}")
                return False
        
        if not workspace:
            logger.warning(f"IsWorkspaceMember.has_object_permission: No workspace found on object")
            return False
            
        try:
            membership = WorkspaceMember.objects.get(
                workspace=workspace,
                user=request.user,
                status='active'
            )
            logger.warning(f"IsWorkspaceMember.has_object_permission: Found membership by workspace")
            return True
        except WorkspaceMember.DoesNotExist:
            logger.warning(f"IsWorkspaceMember.has_object_permission: No membership for workspace {workspace}")
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
