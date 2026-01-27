from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
import secrets
from .models import Workspace, WorkspaceMember, User


class WorkspaceMemberUserSerializer(serializers.ModelSerializer):
    """Simplified user serializer for workspace members"""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'avatar']


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    """Serializer for workspace members"""

    user = WorkspaceMemberUserSerializer(read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    suspended_by_email = serializers.EmailField(source='suspended_by.email', read_only=True)
    deactivated_by_email = serializers.EmailField(source='deactivated_by.email', read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = [
            'id',
            'workspace',
            'user',
            'role',
            'status',
            'invited_by',
            'invited_by_email',
            'invited_at',
            'joined_at',
            'suspended_at',
            'suspended_by',
            'suspended_by_email',
            'deactivated_at',
            'deactivated_by',
            'deactivated_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'workspace',
            'user',
            'invited_by',
            'invited_at',
            'joined_at',
            'suspended_at',
            'suspended_by',
            'deactivated_at',
            'deactivated_by',
            'created_at',
            'updated_at',
        ]

class WorkspaceMemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for workspace members"""

    class Meta:
        model = WorkspaceMember
        fields = [
            'id',
            'workspace',
            'user',
            'invited_by',
            'invited_at',
            'joined_at',
            'suspended_at',
            'suspended_by',
            'deactivated_at',
            'deactivated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class InviteMemberSerializer(serializers.Serializer):
    """Serializer for inviting a new member"""

    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=['admin', 'developer', 'analyst', 'viewer'], default='viewer')
    message = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        """Validate email format and existence"""
        workspace = self.context.get('workspace')

        # Check if user already exists in workspace
        if WorkspaceMember.objects.filter(
            workspace=workspace,
            user__email=value
        ).exists():
            raise serializers.ValidationError("User is already a member of this workspace.")

        return value

    def create(self, validated_data):
        """Create invitation for new or existing user"""
        workspace = self.context['workspace']
        invited_by = self.context['request'].user
        email = validated_data['email']
        role = validated_data['role']

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create placeholder user for invitation
            user = User.objects.create(
                email=email,
                username=email.split('@')[0] + '_' + secrets.token_hex(4),
                is_active=False,  # Not activated yet
            )

        # Generate invitation token
        invitation_token = secrets.token_urlsafe(32)
        invitation_expires_at = timezone.now() + timedelta(days=7)

        # Create workspace member
        member = WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role=role,
            status='invited',
            invited_by=invited_by,
            invitation_token=invitation_token,
            invitation_expires_at=invitation_expires_at,
        )

        # TODO: Send invitation email (implement in views)

        return member


class UpdateMemberRoleSerializer(serializers.Serializer):
    """Serializer for updating member role"""

    role = serializers.ChoiceField(
        choices=['admin', 'developer', 'analyst', 'viewer'],
        required=True
    )

    def validate_role(self, value):
        """Prevent changing owner role"""
        member = self.context.get('member')
        if member and member.role == 'owner':
            raise serializers.ValidationError("Cannot change the role of workspace owner.")
        return value


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for workspaces"""

    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'owner',
            'owner_email',
            'owner_name',
            'status',
            'settings',
            'member_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.filter(status='active').count()


class CreateWorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for creating a new workspace"""

    class Meta:
        model = Workspace
        fields = ['name', 'slug', 'description']

    def create(self, validated_data):
        """Create workspace with owner"""
        user = self.context['request'].user

        # Create workspace
        workspace = Workspace.objects.create(
            owner=user,
            status='active',
            **validated_data
        )

        # Add owner as member
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role='owner',
            status='active',
            joined_at=timezone.now(),
        )

        return workspace
