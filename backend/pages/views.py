from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Page, PageFollower, PageAdmin
from .serializers import PageSerializer, PageFollowerSerializer, PageAdminSerializer

class PageListCreateView(generics.ListCreateAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'
    
    def perform_update(self, serializer):
        if serializer.instance.owner != self.request.user:
            return Response({'error': 'Only page owner can update'}, status=status.HTTP_403_FORBIDDEN)
        
        # Handle profile picture removal
        if self.request.data.get('remove_profile_picture') == 'true':
            if serializer.instance.profile_picture:
                serializer.instance.profile_picture.delete(save=False)
            serializer.instance.profile_picture = None
        
        # Handle cover photo removal
        if self.request.data.get('remove_cover_photo') == 'true':
            if serializer.instance.cover_photo:
                serializer.instance.cover_photo.delete(save=False)
            serializer.instance.cover_photo = None
        
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            return Response({'error': 'Only page owner can delete'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()

class MyPagesView(generics.ListAPIView):
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Page.objects.filter(owner=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow_page(request, page_id):
    try:
        page = Page.objects.get(id=page_id)
    except Page.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)
    
    follower, created = PageFollower.objects.get_or_create(user=request.user, page=page)
    
    if not created:
        follower.delete()
        return Response({'message': 'Unfollowed page'}, status=status.HTTP_200_OK)
    
    return Response({'message': 'Following page'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def page_followers(request, page_id):
    try:
        page = Page.objects.get(id=page_id)
    except Page.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)
    
    followers = PageFollower.objects.filter(page=page)
    serializer = PageFollowerSerializer(followers, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_page_admin(request, page_id):
    try:
        page = Page.objects.get(id=page_id)
    except Page.DoesNotExist:
        return Response({'error': 'Page not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if page.owner != request.user:
        return Response({'error': 'Only page owner can add admins'}, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    role = request.data.get('role', 'editor')
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    admin, created = PageAdmin.objects.get_or_create(page=page, user=user, defaults={'role': role})
    
    if not created:
        return Response({'error': 'User is already an admin'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PageAdminSerializer(admin)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
