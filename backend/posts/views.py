from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Post, Like
from .serializers import PostSerializer, LikeSerializer

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Filter out posts from blocked/disabled users
        queryset = Post.objects.filter(author__is_active=True)
        
        # If user is authenticated, also filter out posts from users they have blocked
        if self.request.user.is_authenticated:
            from users.models import BlockedUser
            blocked_user_ids = BlockedUser.objects.filter(
                blocker=self.request.user
            ).values_list('blocked_id', flat=True)
            queryset = queryset.exclude(author_id__in=blocked_user_ids)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Filter out posts from blocked/disabled users
        queryset = Post.objects.filter(author__is_active=True)
        
        # If user is authenticated, also filter out posts from users they have blocked
        if self.request.user.is_authenticated:
            from users.models import BlockedUser
            blocked_user_ids = BlockedUser.objects.filter(
                blocker=self.request.user
            ).values_list('blocked_id', flat=True)
            queryset = queryset.exclude(author_id__in=blocked_user_ids)
        
        return queryset

    def perform_update(self, serializer):
        # Allow author or admin to edit
        if serializer.instance.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Handle image removal
        if self.request.data.get('remove_image') == 'true':
            if serializer.instance.image:
                serializer.instance.image.delete(save=False)
            serializer.instance.image = None
        
        # Handle video removal
        if self.request.data.get('remove_video') == 'true':
            if serializer.instance.video:
                serializer.instance.video.delete(save=False)
            serializer.instance.video = None
        
        serializer.save()

    def perform_destroy(self, instance):
        # Allow author or admin to delete
        if instance.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    
    if not created:
        like.delete()
        return Response({'message': 'Post unliked'}, status=status.HTTP_200_OK)
    
    return Response({'message': 'Post liked'}, status=status.HTTP_201_CREATED)
