from rest_framework.permissions import BasePermission
from .models import User


class IsOrganizer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            User.ROLE_ORGANIZER, User.ROLE_ADMIN
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.ROLE_ADMIN


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == User.ROLE_ADMIN:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'organizer', None)
        return owner == request.user
