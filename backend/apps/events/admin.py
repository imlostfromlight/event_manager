from django.contrib import admin
from .models import Category, Event, EventRegistration, Comment, Review, Report, FavoriteEvent


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'category', 'event_type', 'event_format', 'status', 'start_time']
    list_filter = ['status', 'event_type', 'event_format', 'visibility', 'category']
    search_fields = ['title', 'description', 'organizer__email']
    raw_id_fields = ['organizer']
    date_hierarchy = 'start_time'


@admin.register(EventRegistration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'status', 'registered_at']
    list_filter = ['status']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'created_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'rating', 'created_at']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'reason', 'is_resolved', 'created_at']
    list_filter = ['reason', 'is_resolved']
    actions = ['mark_resolved']

    def mark_resolved(self, request, queryset):
        queryset.update(is_resolved=True)
    mark_resolved.short_description = 'Отметить как решённые'


@admin.register(FavoriteEvent)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'saved_at']
