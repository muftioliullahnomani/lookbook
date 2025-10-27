from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Group, GroupMember
from .serializers import GroupSerializer, GroupMemberSerializer

class GroupListCreateView(generics.ListCreateAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        # Auto-add creator as admin
        GroupMember.objects.create(group=group, user=self.request.user, role='admin')

class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_update(self, serializer):
        if serializer.instance.created_by != self.request.user:
            return Response({'error': 'Only creator can update'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            return Response({'error': 'Only creator can delete'}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_group(request, pk):
    try:
        group = Group.objects.get(pk=pk)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    
    member, created = GroupMember.objects.get_or_create(group=group, user=request.user)
    
    if created:
        return Response({'message': 'Joined group'}, status=status.HTTP_201_CREATED)
    return Response({'message': 'Already a member'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def leave_group(request, pk):
    try:
        group = Group.objects.get(pk=pk)
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        member = GroupMember.objects.get(group=group, user=request.user)
        member.delete()
        return Response({'message': 'Left group'}, status=status.HTTP_200_OK)
    except GroupMember.DoesNotExist:
        return Response({'error': 'Not a member'}, status=status.HTTP_400_BAD_REQUEST)
