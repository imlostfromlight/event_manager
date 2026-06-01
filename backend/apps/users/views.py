from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import User, FriendRequest
from .serializers import (
    RegisterSerializer, UserSerializer, UserPublicSerializer,
    CustomTokenObtainPairSerializer, FriendRequestSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserSearchView(generics.ListAPIView):
    serializer_class = UserPublicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '')
        if not q:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        ).exclude(id=self.request.user.id)[:20]


class FriendsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        friends = request.user.friends.all()
        return Response(UserPublicSerializer(friends, many=True).data)

    @action(detail=False, methods=['delete'], url_path='remove/(?P<user_id>[^/.]+)')
    def remove(self, request, user_id=None):
        try:
            friend = User.objects.get(id=user_id)
            request.user.friends.remove(friend)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class FriendRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        ).select_related('from_user', 'to_user')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.to_user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        req.status = FriendRequest.STATUS_ACCEPTED
        req.save()
        req.from_user.friends.add(req.to_user)
        return Response({'status': 'accepted'})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        req = self.get_object()
        if req.to_user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        req.status = FriendRequest.STATUS_DECLINED
        req.save()
        return Response({'status': 'declined'})
