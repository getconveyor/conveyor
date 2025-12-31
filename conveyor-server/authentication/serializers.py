from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, ApiKey


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'role',
            'status',
            'preferences',
            'last_login',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
        ]

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'avatar',
            'preferences',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        """Validate passwords"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value

    def save(self, **kwargs):
        """Update user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        """Authenticate user"""
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Authenticate using email
            try:
                user = User.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
            except User.DoesNotExist:
                user = None

            if not user:
                raise serializers.ValidationError('Unable to log in with provided credentials.')

            if user.status != 'active':
                raise serializers.ValidationError('User account is disabled.')

        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        attrs['user'] = user
        return attrs


class ApiKeySerializer(serializers.ModelSerializer):
    """Serializer for API Keys"""

    class Meta:
        model = ApiKey
        fields = [
            'id',
            'name',
            'permissions',
            'last_used',
            'expires_at',
            'created_at',
        ]
        read_only_fields = ['id', 'last_used', 'created_at']


class ApiKeyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating API Keys"""

    key = serializers.CharField(read_only=True)

    class Meta:
        model = ApiKey
        fields = [
            'id',
            'name',
            'permissions',
            'expires_at',
            'key',
        ]
        read_only_fields = ['id', 'key']

    def create(self, validated_data):
        """Create API key with generated key"""
        import secrets
        import hashlib

        # Generate a secure random key
        key = secrets.token_urlsafe(32)

        # Hash the key for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        api_key = ApiKey.objects.create(
            key_hash=key_hash,
            user=self.context['request'].user,
            **validated_data
        )

        # Attach the plain key to the instance for response
        api_key.key = key
        return api_key
