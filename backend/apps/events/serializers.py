from rest_framework import serializers
from .models import Category, Event, EventRegistration, Comment, Review, Report, FavoriteEvent


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'slug']


class EventListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    registrations_count = serializers.IntegerField(read_only=True)
    is_registered = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    organizer_id = serializers.IntegerField(source='organizer.id', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'category', 'cover_image', 'event_type', 'event_format',
            'visibility', 'status', 'start_time', 'end_time', 'place',
            'participant_limit', 'registrations_count', 'is_registered', 'is_favorite',
            'organizer_name', 'organizer_id', 'created_at',
        ]

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user, status='registered').exists()
        return False

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class EventDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), write_only=True, source='category', required=False
    )
    registrations_count = serializers.IntegerField(read_only=True)
    is_registered = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    map_link = serializers.CharField(read_only=True)
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    organizer_id = serializers.IntegerField(source='organizer.id', read_only=True)
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'category', 'category_id', 'cover_image',
            'event_type', 'event_format', 'visibility', 'status',
            'place', 'latitude', 'longitude', 'map_link',
            'meeting_link', 'start_time', 'end_time', 'participant_limit',
            'private_token', 'registrations_count', 'is_registered', 'is_favorite',
            'organizer_name', 'organizer_id', 'avg_rating', 'created_at', 'updated_at',
        ]
        read_only_fields = ['private_token', 'meeting_link', 'organizer_name', 'organizer_id']

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user, status='registered').exists()
        return False

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user_name', 'user_avatar', 'text', 'created_at']
        read_only_fields = ['id', 'user_name', 'user_avatar', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'text', 'created_at']
        read_only_fields = ['id', 'user_name', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'reason', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegistrationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = EventRegistration
        fields = ['id', 'user_email', 'user_name', 'registered_at', 'status']
        read_only_fields = ['id', 'user_email', 'user_name', 'registered_at']
