from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import RegisterView, LoginView, MeView, UserSearchView, FriendsViewSet, FriendRequestViewSet

router = DefaultRouter()
router.register('friends', FriendsViewSet, basename='friends')
router.register('friend-requests', FriendRequestViewSet, basename='friend-requests')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', TokenBlacklistView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('', include(router.urls)),
]
