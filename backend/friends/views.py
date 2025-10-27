from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Friendship
from .serializers import FriendshipSerializer
from users.serializers import UserSerializer

User = get_user_model()

class FriendshipListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(
            from_user=self.request.user, status='accepted'
        ) | Friendship.objects.filter(
            to_user=self.request.user, status='accepted'
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_friend_categories(request):
    """
    Returns three categories of users:
    1. Already friends (accepted)
    2. Pending requests (sent or received)
    3. Suggested users (not friends, no pending request)
    """
    user = request.user
    
    # Category 1: Already Friends (accepted friendships)
    accepted_friendships = Friendship.objects.filter(
        Q(from_user=user, status='accepted') | Q(to_user=user, status='accepted')
    )
    
    friends = []
    from users.models import BlockedUser
    for friendship in accepted_friendships:
        friend = friendship.to_user if friendship.from_user == user else friendship.from_user
        has_blocked_me = BlockedUser.objects.filter(blocker=friend, blocked=user).exists()
        friends.append({
            'id': friend.id,
            'username': friend.username,
            'first_name': friend.first_name,
            'last_name': friend.last_name,
            'profile_picture': friend.profile_picture.url if friend.profile_picture else None,
            'friendship_id': friendship.id,
            'status': 'accepted',
            'category': 'friends',
            'is_active': friend.is_active,
            'has_blocked_me': has_blocked_me
        })
    
    # Category 2: Pending Requests
    # Sent by me
    sent_requests = Friendship.objects.filter(from_user=user, status='pending')
    # Received by me
    received_requests = Friendship.objects.filter(to_user=user, status='pending')
    
    pending = []
    for friendship in sent_requests:
        has_blocked_me = BlockedUser.objects.filter(blocker=friendship.to_user, blocked=user).exists()
        pending.append({
            'id': friendship.to_user.id,
            'username': friendship.to_user.username,
            'first_name': friendship.to_user.first_name,
            'last_name': friendship.to_user.last_name,
            'profile_picture': friendship.to_user.profile_picture.url if friendship.to_user.profile_picture else None,
            'friendship_id': friendship.id,
            'status': 'pending',
            'request_type': 'sent',
            'category': 'pending',
            'is_active': friendship.to_user.is_active,
            'has_blocked_me': has_blocked_me
        })
    
    for friendship in received_requests:
        has_blocked_me = BlockedUser.objects.filter(blocker=friendship.from_user, blocked=user).exists()
        pending.append({
            'id': friendship.from_user.id,
            'username': friendship.from_user.username,
            'first_name': friendship.from_user.first_name,
            'last_name': friendship.from_user.last_name,
            'profile_picture': friendship.from_user.profile_picture.url if friendship.from_user.profile_picture else None,
            'friendship_id': friendship.id,
            'status': 'pending',
            'request_type': 'received',
            'category': 'pending',
            'is_active': friendship.from_user.is_active,
            'has_blocked_me': has_blocked_me
        })
    
    # Category 3: Suggested Users (no relationship)
    # Get all user IDs that have any relationship with current user
    related_user_ids = set()
    all_relationships = Friendship.objects.filter(
        Q(from_user=user) | Q(to_user=user)
    )
    for rel in all_relationships:
        if rel.from_user == user:
            related_user_ids.add(rel.to_user.id)
        else:
            related_user_ids.add(rel.from_user.id)
    
    # Exclude self, related users, and blocked/inactive users
    suggested_users = User.objects.filter(is_active=True).exclude(id=user.id).exclude(id__in=related_user_ids)[:20]
    
    suggestions = []
    from users.models import BlockedUser
    for suggested_user in suggested_users:
        # Check if this user has blocked me
        has_blocked_me = BlockedUser.objects.filter(blocker=suggested_user, blocked=user).exists()
        # Check if I have blocked this user
        i_have_blocked = BlockedUser.objects.filter(blocker=user, blocked=suggested_user).exists()
        
        suggestions.append({
            'id': suggested_user.id,
            'username': suggested_user.username,
            'first_name': suggested_user.first_name,
            'last_name': suggested_user.last_name,
            'profile_picture': suggested_user.profile_picture.url if suggested_user.profile_picture else None,
            'status': 'none',
            'category': 'suggestions',
            'is_active': suggested_user.is_active,
            'has_blocked_me': has_blocked_me,
            'i_have_blocked': i_have_blocked
        })
    
    return Response({
        'friends': friends,
        'pending': pending,
        'suggestions': suggestions
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_friend_request(request, user_id):
    print(f"Friend request from user {request.user.id} to user {user_id}")
    
    try:
        to_user = User.objects.get(id=user_id)
        print(f"Target user found: {to_user.username}")
    except User.DoesNotExist:
        print(f"User {user_id} not found")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if to_user == request.user:
        print("Cannot send friend request to yourself")
        return Response({'error': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if target user is blocked/inactive
    if not to_user.is_active:
        print(f"User {to_user.username} is blocked/inactive")
        return Response({'error': 'Cannot send friend request to this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if either user has blocked the other
    from users.models import BlockedUser
    blocked_relationship = BlockedUser.objects.filter(
        (Q(blocker=request.user, blocked=to_user) | Q(blocker=to_user, blocked=request.user))
    ).first()
    
    if blocked_relationship:
        print(f"Users have blocked each other")
        return Response({'error': 'Cannot send friend request to this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if friendship already exists in either direction
    existing_friendship = Friendship.objects.filter(
        from_user=request.user, to_user=to_user
    ).first() or Friendship.objects.filter(
        from_user=to_user, to_user=request.user
    ).first()
    
    if existing_friendship:
        print(f"Existing friendship found: {existing_friendship.status}")
        if existing_friendship.status == 'accepted':
            print("Already friends")
            return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing_friendship.status == 'pending':
            print("Friend request already pending")
            return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing_friendship.status == 'rejected':
            print("Resending previously rejected request")
            # Allow resending if previously rejected
            existing_friendship.status = 'pending'
            existing_friendship.from_user = request.user
            existing_friendship.to_user = to_user
            existing_friendship.save()
            return Response(FriendshipSerializer(existing_friendship).data, status=status.HTTP_200_OK)
    
    # Create new friendship request
    print("Creating new friendship request")
    try:
        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=to_user,
            status='pending'
        )
        print(f"Friendship created successfully: {friendship.id}")
        return Response(FriendshipSerializer(friendship).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"Error creating friendship: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_friend_request(request, friendship_id):
    try:
        friendship = Friendship.objects.get(id=friendship_id, to_user=request.user)
    except Friendship.DoesNotExist:
        return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    friendship.status = 'accepted'
    friendship.save()
    
    return Response(FriendshipSerializer(friendship).data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_friend_request(request, friendship_id):
    try:
        # Allow both sender (to cancel) and receiver (to reject)
        friendship = Friendship.objects.get(
            Q(id=friendship_id) & (Q(from_user=request.user) | Q(to_user=request.user))
        )
    except Friendship.DoesNotExist:
        return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # If the sender is cancelling, delete the request
    if friendship.from_user == request.user:
        friendship.delete()
        return Response({'message': 'Friend request cancelled'}, status=status.HTTP_200_OK)
    
    # If the receiver is rejecting, mark as rejected
    friendship.status = 'rejected'
    friendship.save()
    
    return Response(FriendshipSerializer(friendship).data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unfriend(request, friendship_id):
    """
    Remove an accepted friendship (unfriend)
    """
    try:
        # Check if friendship exists and user is part of it
        friendship = Friendship.objects.get(
            Q(id=friendship_id) & 
            (Q(from_user=request.user) | Q(to_user=request.user)) &
            Q(status='accepted')
        )
    except Friendship.DoesNotExist:
        return Response({'error': 'Friendship not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Delete the friendship
    friendship.delete()
    
    return Response({'message': 'Unfriended successfully'}, status=status.HTTP_200_OK)
