from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Workspace, WorkspaceMember
from .workspace_serializers import (
    WorkspaceSerializer,
    CreateWorkspaceSerializer,
    WorkspaceMemberSerializer,
    InviteMemberSerializer,
    UpdateMemberRoleSerializer,
)
from .permissions import IsWorkspaceOwnerOrAdmin, IsWorkspaceOwner


class WorkspaceViewSet(viewsets.ModelViewSet):
    """ViewSet for workspace management"""

    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return workspaces where user is a member"""
        return Workspace.objects.filter(
            members__user=self.request.user,
            members__status='active'
        ).distinct()

    def get_serializer_class(self):
        """Return appropriate serializer class"""
        if self.action == 'create':
            return CreateWorkspaceSerializer
        return WorkspaceSerializer

    def perform_create(self, serializer):
        """Create workspace with owner"""
        serializer.save()

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List all workspace members"""
        workspace = self.get_object()
        members = workspace.members.all()
        serializer = WorkspaceMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsWorkspaceOwnerOrAdmin])
    def invite_member(self, request, pk=None):
        """
        Invite a new member to the workspace
        Requires: owner or admin role
        """
        workspace = self.get_object()

        serializer = InviteMemberSerializer(
            data=request.data,
            context={'request': request, 'workspace': workspace}
        )

        if serializer.is_valid():
            member = serializer.save()

            # TODO: Send invitation email
            # send_invitation_email(
            #     to_email=member.user.email,
            #     workspace=workspace,
            #     invited_by=request.user,
            #     invitation_token=member.invitation_token
            # )

            return Response(
                {
                    'detail': f'Invitation sent to {member.user.email}',
                    'member': WorkspaceMemberSerializer(member).data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsWorkspaceOwnerOrAdmin], url_path='members/(?P<member_id>[^/.]+)/role')
    def update_member_role(self, request, pk=None, member_id=None):
        """
        Update a member's role
        Requires: owner or admin role
        Cannot change owner role
        """
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        serializer = UpdateMemberRoleSerializer(
            data=request.data,
            context={'member': member}
        )

        if serializer.is_valid():
            member.role = serializer.validated_data['role']
            member.save()

            return Response({
                'detail': f'Role updated to {member.role}',
                'member': WorkspaceMemberSerializer(member).data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsWorkspaceOwnerOrAdmin], url_path='members/(?P<member_id>[^/.]+)/suspend')
    def suspend_member(self, request, pk=None, member_id=None):
        """
        Suspend a workspace member
        Requires: owner or admin role
        Cannot suspend owner
        """
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        if member.role == 'owner':
            return Response(
                {'error': 'Cannot suspend workspace owner'},
                status=status.HTTP_403_FORBIDDEN
            )

        if member.status == 'suspended':
            return Response(
                {'error': 'Member is already suspended'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.status = 'suspended'
        member.suspended_at = timezone.now()
        member.suspended_by = request.user
        member.save()

        return Response({
            'detail': f'{member.user.email} has been suspended',
            'member': WorkspaceMemberSerializer(member).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsWorkspaceOwnerOrAdmin], url_path='members/(?P<member_id>[^/.]+)/activate')
    def activate_member(self, request, pk=None, member_id=None):
        """
        Activate a suspended or deactivated member
        Requires: owner or admin role
        """
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        if member.status == 'active':
            return Response(
                {'error': 'Member is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.status = 'active'
        member.suspended_at = None
        member.suspended_by = None
        member.deactivated_at = None
        member.deactivated_by = None
        member.save()

        return Response({
            'detail': f'{member.user.email} has been activated',
            'member': WorkspaceMemberSerializer(member).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsWorkspaceOwnerOrAdmin], url_path='members/(?P<member_id>[^/.]+)/deactivate')
    def deactivate_member(self, request, pk=None, member_id=None):
        """
        Deactivate a workspace member
        Requires: owner or admin role
        Cannot deactivate owner
        """
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        if member.role == 'owner':
            return Response(
                {'error': 'Cannot deactivate workspace owner'},
                status=status.HTTP_403_FORBIDDEN
            )

        if member.status == 'deactivated':
            return Response(
                {'error': 'Member is already deactivated'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.status = 'deactivated'
        member.deactivated_at = timezone.now()
        member.deactivated_by = request.user
        member.save()

        return Response({
            'detail': f'{member.user.email} has been deactivated',
            'member': WorkspaceMemberSerializer(member).data
        })

    @action(detail=True, methods=['delete'], permission_classes=[IsWorkspaceOwnerOrAdmin], url_path='members/(?P<member_id>[^/.]+)')
    def remove_member(self, request, pk=None, member_id=None):
        """
        Remove a member from the workspace
        Requires: owner or admin role
        Cannot remove owner
        """
        workspace = self.get_object()
        member = get_object_or_404(WorkspaceMember, id=member_id, workspace=workspace)

        if member.role == 'owner':
            return Response(
                {'error': 'Cannot remove workspace owner'},
                status=status.HTTP_403_FORBIDDEN
            )

        email = member.user.email
        member.delete()

        return Response({
            'detail': f'{email} has been removed from the workspace'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def switch(self, request):
        """Switch active workspace"""
        workspace_id = request.data.get('workspace_id')

        if not workspace_id:
            return Response(
                {'error': 'workspace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user has access to workspace
        try:
            membership = WorkspaceMember.objects.get(
                user=request.user,
                workspace_id=workspace_id,
                status='active'
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {'error': 'Workspace not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        workspace = membership.workspace

        # Store in session or return workspace info
        # Frontend will store this in context
        return Response({
            'detail': 'Workspace switched successfully',
            'workspace': WorkspaceSerializer(workspace).data,
            'membership': WorkspaceMemberSerializer(membership).data,
        })
