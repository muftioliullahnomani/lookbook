from django.urls import path
from .views import PostListCreateView, PostDetailView, toggle_like

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:pk>/like/', toggle_like, name='post-like'),
]
