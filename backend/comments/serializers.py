from rest_framework import serializers
from .models import Comment
from users.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'post', 'parent', 'content', 'created_at', 'updated_at', 'replies', 'replies_count', 'is_hidden', 'is_deleted']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_hidden', 'is_deleted']

    def get_author(self, obj):
        return UserSerializer(obj.author, context=self.context).data

    def get_replies(self, obj):
        # Include all replies for top-level comments from active users (including hidden/deleted)
        if obj.parent is None:
            replies = obj.replies.filter(author__is_active=True)
            return CommentSerializer(replies, many=True, context=self.context).data
        return []

    def get_replies_count(self, obj):
        # Count all replies from active users (including hidden/deleted)
        return obj.replies.filter(author__is_active=True).count()
