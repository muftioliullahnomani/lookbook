from django.urls import path
from .views import (
    PageListCreateView, PageDetailView, MyPagesView,
    toggle_follow_page, page_followers, add_page_admin
)

urlpatterns = [
    path('', PageListCreateView.as_view(), name='page-list-create'),
    path('my/', MyPagesView.as_view(), name='my-pages'),
    path('<str:username>/', PageDetailView.as_view(), name='page-detail'),
    path('<int:page_id>/follow/', toggle_follow_page, name='toggle-follow-page'),
    path('<int:page_id>/followers/', page_followers, name='page-followers'),
    path('<int:page_id>/add-admin/', add_page_admin, name='add-page-admin'),
]
