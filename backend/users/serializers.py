from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    can_use_rich_editor = serializers.SerializerMethodField()
    has_blocked_me = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'bio', 
                  'profile_picture', 'cover_photo', 'date_of_birth', 'location', 
                  'website', 'created_at', 'is_staff', 'is_superuser', 
                  'can_use_rich_editor', 'rich_editor_requested', 'is_active', 'has_blocked_me']
        read_only_fields = ['id', 'created_at', 'is_staff', 'is_superuser', 
                           'can_use_rich_editor', 'rich_editor_requested', 'is_active', 'has_blocked_me']
    
    def get_can_use_rich_editor(self, obj):
        """
        Return True if user is superuser, staff, or has explicit permission.
        This ensures superusers and staff automatically get rich editor access.
        """
        return obj.has_rich_editor_access
    
    def get_has_blocked_me(self, obj):
        """
        Check if this user has blocked the current request user
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import BlockedUser
            return BlockedUser.objects.filter(blocker=obj, blocked=request.user).exists()
        return False

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class EnsureSuperuserRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    token = serializers.CharField(required=False, write_only=True, help_text="Optional. Can also be provided via X-Setup-Token header")

class PromoteUserRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    superuser = serializers.BooleanField(required=False, default=True)
    token = serializers.CharField(required=False, write_only=True, help_text="Optional. Can also be provided via X-Setup-Token header")
