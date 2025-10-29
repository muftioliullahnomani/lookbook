from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    EnsureSuperuserRequestSerializer,
    PromoteUserRequestSerializer,
)
from .models import BlockedUser, UnblockRequest
import os
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that checks if user is disabled"""
    
    def post(self, request, *args, **kwargs):
        # Get username from request
        username = request.data.get('username')
        
        if username:
            try:
                user = User.objects.get(username=username)
                if not user.is_active:
                    return Response(
                        {'error': 'You are disabled. Your account has been deactivated by administrators.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except User.DoesNotExist:
                pass  # Let the parent class handle invalid credentials
        
        return super().post(request, *args, **kwargs)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
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

class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_rich_editor_access(request):
    """
    Allow users to request rich text editor access.
    Staff and superusers automatically have access and don't need to request.
    """
    user = request.user
    
    # Check if user already has access (including staff/superuser)
    if user.has_rich_editor_access:
        return Response({'message': 'You already have rich editor access'}, status=status.HTTP_200_OK)
    
    if user.rich_editor_requested:
        return Response({'message': 'You have already requested access. Please wait for admin approval.'}, status=status.HTTP_200_OK)
    
    user.rich_editor_requested = True
    user.rich_editor_request_date = timezone.now()
    user.save()
    
    return Response({
        'message': 'Rich editor access requested successfully. Admin will review your request.',
        'requested': True
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_rich_editor_request(request):
    """
    Allow users to cancel their rich text editor access request
    """
    user = request.user
    
    if not user.rich_editor_requested:
        return Response({'message': 'No pending request to cancel'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.rich_editor_requested = False
    user.rich_editor_request_date = None
    user.save()
    
    return Response({
        'message': 'Request cancelled successfully',
        'cancelled': True
    }, status=status.HTTP_200_OK)

class EnsureSuperuserSetupView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=EnsureSuperuserRequestSerializer,
        responses={
            201: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="superuser created",
            ),
            403: OpenApiResponse(description="Forbidden or superuser already exists"),
            400: OpenApiResponse(description="Bad Request"),
        },
        parameters=[
            OpenApiParameter(
                name="X-Setup-Token",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.HEADER,
                description="Setup admin token. Alternatively provide 'token' in request body.",
                required=False,
            )
        ],
        description="One-time endpoint to create a superuser if none exists. Protected by SETUP_ADMIN_TOKEN (X-Setup-Token header or token in body).",
    )
    def post(self, request):
        token = request.headers.get('X-Setup-Token') or request.data.get('token')
        expected = os.getenv('SETUP_ADMIN_TOKEN')
        if not expected or token != expected:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        if User.objects.filter(is_superuser=True).exists():
            return Response({'detail': 'Superuser already exists'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        if not username or not password:
            return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(username=username, defaults={'email': email or ''})
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        return Response({'detail': 'superuser created', 'username': user.username}, status=status.HTTP_201_CREATED)

class PromoteUserView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=PromoteUserRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="user promoted",
            ),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="User not found"),
            400: OpenApiResponse(description="Bad Request"),
        },
        parameters=[
            OpenApiParameter(
                name="X-Setup-Token",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.HEADER,
                description="Setup admin token. Alternatively provide 'token' in request body.",
                required=False,
            )
        ],
        description="Promote an existing user to staff/superuser. Protected by SETUP_ADMIN_TOKEN (X-Setup-Token header or token in body).",
    )
    def post(self, request):
        token = request.headers.get('X-Setup-Token') or request.data.get('token')
        expected = os.getenv('SETUP_ADMIN_TOKEN')
        if not expected or token != expected:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username')
        make_superuser = bool(request.data.get('superuser', True))
        if not username:
            return Response({'detail': 'username required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = True
        user.is_staff = True
        if make_superuser:
            user.is_superuser = True
        user.save()
        return Response({'detail': 'user promoted', 'username': user.username, 'is_staff': user.is_staff, 'is_superuser': user.is_superuser}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def block_user(request, user_id):
    """Block a user and remove friendship if exists"""
    try:
        user_to_block = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if user_to_block == request.user:
        return Response({'error': 'You cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Remove friendship if exists
    from friends.models import Friendship
    from django.db.models import Q
    
    Friendship.objects.filter(
        Q(from_user=request.user, to_user=user_to_block) |
        Q(from_user=user_to_block, to_user=request.user)
    ).delete()
    
    blocked, created = BlockedUser.objects.get_or_create(
        blocker=request.user,
        blocked=user_to_block
    )
    
    if created:
        return Response({'message': 'User blocked successfully'}, status=status.HTTP_201_CREATED)
    return Response({'message': 'User already blocked'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unblock_user(request, user_id):
    """Unblock a user"""
    try:
        user_to_unblock = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        blocked = BlockedUser.objects.get(blocker=request.user, blocked=user_to_unblock)
        blocked.delete()
        return Response({'message': 'User unblocked successfully'}, status=status.HTTP_200_OK)
    except BlockedUser.DoesNotExist:
        return Response({'error': 'User is not blocked'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def blocked_users_list(request):
    """Get list of blocked users"""
    blocked = BlockedUser.objects.filter(blocker=request.user).select_related('blocked')
    blocked_users = [UserSerializer(b.blocked).data for b in blocked]
    return Response(blocked_users, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_unblock(request):
    """Request to unblock account"""
    message = request.data.get('message', '')
    
    if not message:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is actually blocked
    if request.user.is_active:
        return Response({'error': 'Your account is not blocked'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if there's already a pending request
    existing_request = UnblockRequest.objects.filter(
        user=request.user,
        status='pending'
    ).first()
    
    if existing_request:
        return Response({'error': 'You already have a pending unblock request'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create unblock request
    UnblockRequest.objects.create(
        user=request.user,
        message=message
    )
    
    return Response({'message': 'Unblock request submitted successfully'}, status=status.HTTP_201_CREATED)
