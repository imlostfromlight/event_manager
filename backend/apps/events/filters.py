import django_filters
from .models import Event


class EventFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    event_type = django_filters.CharFilter(field_name='event_type')
    event_format = django_filters.CharFilter(field_name='event_format')
    start_after = django_filters.DateTimeFilter(field_name='start_time', lookup_expr='gte')
    start_before = django_filters.DateTimeFilter(field_name='start_time', lookup_expr='lte')
    status = django_filters.CharFilter(field_name='status')

    class Meta:
        model = Event
        fields = ['category', 'event_type', 'event_format', 'start_after', 'start_before', 'status']
