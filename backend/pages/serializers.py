from rest_framework import serializers
from .models import Page, PageFollower, PageAdmin
from users.serializers import UserSerializer

class PageSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = Page
        fields = ['id', 'owner', 'name', 'username', 'description', 'category', 
                  'profile_picture', 'cover_photo', 'website', 'email', 'phone', 
                  'location', 'is_verified', 'created_at', 'updated_at', 
                  'followers_count', 'is_following', 'is_owner']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified']
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(user=request.user).exists()
        return False
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False

class PageFollowerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    page = PageSerializer(read_only=True)
    
    class Meta:
        model = PageFollower
        fields = ['id', 'page', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']

class PageAdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    page = PageSerializer(read_only=True)
    
    class Meta:
        model = PageAdmin
        fields = ['id', 'page', 'user', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']
