from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FriendRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'full_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Личные данные', {'fields': ('first_name', 'last_name', 'avatar', 'bio')}),
        ('Роль и права', {'fields': ('role', 'preferences', 'friends', 'is_active', 'is_staff', 'is_superuser')}),
        ('Даты', {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['date_joined', 'last_login']
    filter_horizontal = ['preferences', 'friends', 'groups', 'user_permissions']


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'status', 'created_at']
    list_filter = ['status']
