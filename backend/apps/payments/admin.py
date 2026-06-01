from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['mock_transaction_id', 'user', 'amount', 'method', 'status', 'created_at']
    list_filter = ['method', 'status']
    raw_id_fields = ['user', 'ticket']
    readonly_fields = ['mock_transaction_id', 'created_at', 'updated_at']
