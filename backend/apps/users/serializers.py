from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, FriendRequest


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    preferences = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True, default=list
    )

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2', 'role', 'preferences']

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password2': 'Пароли не совпадают'})
        return data

    def create(self, validated_data):
        preference_ids = validated_data.pop('preferences', [])
        user = User.objects.create_user(**validated_data)
        if preference_ids:
            from apps.events.models import Category
            user.preferences.set(Category.objects.filter(id__in=preference_ids))
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    preferences = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'avatar', 'bio', 'preferences', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined']


class UserPublicSerializer(serializers.ModelSerializer):
    """Public profile — no email."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'avatar', 'bio']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserPublicSerializer(read_only=True)
    to_user = UserPublicSerializer(read_only=True)
    to_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), write_only=True, source='to_user'
    )

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'to_user_id', 'status', 'created_at']
        read_only_fields = ['id', 'from_user', 'status', 'created_at']

    def validate_to_user_id(self, value):
        if value == self.context['request'].user:
            raise serializers.ValidationError('Нельзя отправить запрос самому себе.')
        return value

    def create(self, validated_data):
        validated_data['from_user'] = self.context['request'].user
        return super().create(validated_data)
