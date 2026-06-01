from rest_framework import serializers
from .models import TicketType, Ticket


class TicketTypeSerializer(serializers.ModelSerializer):
    sold_count = serializers.IntegerField(read_only=True)
    available = serializers.IntegerField(read_only=True)

    class Meta:
        model = TicketType
        fields = ['id', 'event', 'name', 'tier', 'description', 'price', 'quantity', 'sold_count', 'available']
        read_only_fields = ['id', 'sold_count', 'available']


class TicketSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='ticket_type.event.title', read_only=True)
    event_id = serializers.IntegerField(source='ticket_type.event.id', read_only=True)
    event_start = serializers.DateTimeField(source='ticket_type.event.start_time', read_only=True)
    ticket_type_name = serializers.CharField(source='ticket_type.name', read_only=True)
    ticket_tier = serializers.CharField(source='ticket_type.tier', read_only=True)
    price = serializers.DecimalField(source='ticket_type.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'unique_code', 'qr_code', 'status', 'purchased_at',
            'event_id', 'event_title', 'event_start', 'ticket_type_name', 'ticket_tier', 'price',
        ]
        read_only_fields = ['id', 'unique_code', 'qr_code', 'purchased_at']


class PurchaseTicketSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['stripe', 'kaspi'])
