from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'method', 'status', 'mock_transaction_id', 'created_at'
        ]
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    ticket_type_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=['stripe', 'kaspi'])
