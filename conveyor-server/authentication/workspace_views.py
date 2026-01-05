from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging
import uuid

from .models import Workspace, WorkspaceMember
from .workspace_serializers import (
    WorkspaceSerializer,
    CreateWorkspaceSerializer,
    WorkspaceMemberSerializer,
    InviteMemberSerializer,
    UpdateMemberRoleSerializer,
    WorkspaceMemberListSerializer
)
from .permissions import IsWorkspaceOwnerOrAdmin, IsWorkspaceOwner

logger = logging.getLogger(__name__)


def send_invitation_email(member, workspace, invited_by):
    """Send workspace invitation email to user"""
    try:
        # Generate invitation token if not exists
        if not member.invitation_token:
            member.invitation_token = str(uuid.uuid4())
            member.save()
        
        # Build invitation URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        invitation_url = f"{frontend_url}/workspace/accept-invite?token={member.invitation_token}&workspace={workspace.id}"
        
        # Email context
        context = {
            'user_name': member.user.first_name or member.user.email.split('@')[0],
            'workspace_name': workspace.name,
            'invited_by_name': invited_by.first_name or invited_by.email.split('@')[0],
            'invited_by_email': invited_by.email,
            'role': member.role,
            'invitation_url': invitation_url,
            'frontend_url': frontend_url,
        }
        
        # Try to render HTML template, fall back to plain text
        try:
            html_message = render_to_string('emails/workspace_invitation.html', context)
            plain_message = strip_tags(html_message)
        except:
            # Fallback plain text email
            plain_message = f"""
Hello {context['user_name']},

You have been invited to join the workspace "{workspace.name}" on Conveyor by {context['invited_by_name']} ({context['invited_by_email']}).

Your role: {member.role.capitalize()}

To accept this invitation, please visit:
{invitation_url}

If you did not expect this invitation, you can ignore this email.

Best regards,
The Conveyor Team
            """
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .button:hover {{ background: #5a67d8; }}
        .role-badge {{ display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 12px; font-size: 14px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
        </div>
        <div class="content">
            <p>Hello {context['user_name']},</p>
            <p><strong>{context['invited_by_name']}</strong> ({context['invited_by_email']}) has invited you to join the workspace <strong>"{workspace.name}"</strong> on Conveyor.</p>
            <p>Your role: <span class="role-badge">{member.role.capitalize()}</span></p>
            <p style="text-align: center;">
                <a href="{invitation_url}" class="button">Accept Invitation</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px;">{invitation_url}</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© Conveyor Data Platform</p>
        </div>
    </div>
</body>
</html>
            """
        
        # Send email
        send_mail(
            subject=f'You\'ve been invited to join "{workspace.name}" on Conveyor',
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@conveyor.io'),
            recipient_list=[member.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Invitation email sent to {member.user.email} for workspace {workspace.name}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send invitation email to {member.user.email}: {str(e)}")
        return False


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
        runs = workspace.members.all().order_by('-created_at')

        # Pagination
        page = self.paginate_queryset(runs)
        if page is not None:
            serializer = WorkspaceMemberListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = WorkspaceMemberListSerializer(runs, many=True)
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

            # Send invitation email
            email_sent = send_invitation_email(
                member=member,
                workspace=workspace,
                invited_by=request.user
            )

            response_data = {
                'detail': f'Invitation sent to {member.user.email}',
                'member': WorkspaceMemberSerializer(member).data,
                'email_sent': email_sent
            }
            
            if not email_sent:
                response_data['warning'] = 'Member added but invitation email could not be sent'

            return Response(response_data, status=status.HTTP_201_CREATED)

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
