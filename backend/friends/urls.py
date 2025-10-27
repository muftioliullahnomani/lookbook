from django.urls import path
from .views import FriendshipListView, send_friend_request, accept_friend_request, reject_friend_request, get_friend_categories, unfriend

urlpatterns = [
    path('', FriendshipListView.as_view(), name='friendship-list'),
    path('categories/', get_friend_categories, name='friend-categories'),
    path('request/<int:user_id>/', send_friend_request, name='send-friend-request'),
    path('accept/<int:friendship_id>/', accept_friend_request, name='accept-friend-request'),
    path('reject/<int:friendship_id>/', reject_friend_request, name='reject-friend-request'),
    path('unfriend/<int:friendship_id>/', unfriend, name='unfriend'),
]
