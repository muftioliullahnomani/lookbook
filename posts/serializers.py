from rest_framework import serializers
from .models import Post, Like
from users.serializers import UserSerializer

class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    page_name = serializers.CharField(source='page.name', read_only=True, allow_null=True)
    page_username = serializers.CharField(source='page.username', read_only=True, allow_null=True)
    page_id = serializers.IntegerField(source='page.id', read_only=True, allow_null=True)
    is_following = serializers.SerializerMethodField()
    is_page_owner = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'page', 'page_name', 'page_username', 'page_id', 
                  'title', 'content', 'image', 'video', 'visibility',
                  'created_at', 'updated_at', 'likes_count', 'comments_count', 'is_liked', 
                  'is_following', 'is_page_owner']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_author(self, obj):
        return UserSerializer(obj.author, context=self.context).data
    
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        # Count only comments from active users
        return obj.comments.filter(author__is_active=True).count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.page:
            from pages.models import PageFollower
            return PageFollower.objects.filter(user=request.user, page=obj.page).exists()
        return False

    def get_is_page_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.page:
            from pages.models import PageAdmin
            # Check if user is page owner or admin
            is_owner = obj.page.owner == request.user
            is_admin = PageAdmin.objects.filter(page=obj.page, user=request.user).exists()
            return is_owner or is_admin
        return False

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
