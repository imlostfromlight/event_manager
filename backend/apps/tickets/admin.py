from django.contrib import admin
from .models import TicketType, Ticket


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ['event', 'name', 'tier', 'price', 'quantity', 'sold_count', 'available']
    list_filter = ['tier']
    raw_id_fields = ['event']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['unique_code', 'user', 'ticket_type', 'status', 'purchased_at']
    list_filter = ['status']
    raw_id_fields = ['user', 'ticket_type']
    readonly_fields = ['unique_code', 'qr_code', 'purchased_at']
