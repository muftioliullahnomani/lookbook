from django.urls import path
from .views import (
    UserRegistrationView,
    UserProfileView,
    UserDetailView,
    request_rich_editor_access,
    cancel_rich_editor_request,
    block_user,
    unblock_user,
    blocked_users_list,
    request_unblock,
    EnsureSuperuserSetupView,
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('rich-editor/request/', request_rich_editor_access, name='request-rich-editor'),
    path('rich-editor/cancel/', cancel_rich_editor_request, name='cancel-rich-editor'),
    path('<int:user_id>/block/', block_user, name='block-user'),
    path('<int:user_id>/unblock/', unblock_user, name='unblock-user'),
    path('blocked/', blocked_users_list, name='blocked-users'),
    path('request-unblock/', request_unblock, name='request-unblock'),
    # One-time secure setup to create superuser (only if none exists)
    path('setup/ensure-superuser/', EnsureSuperuserSetupView.as_view(), name='ensure-superuser'),
]
