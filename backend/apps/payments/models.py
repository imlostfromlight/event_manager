import uuid
from django.db import models
from django.conf import settings


class Payment(models.Model):
    METHOD_STRIPE = 'stripe'
    METHOD_KASPI = 'kaspi'
    METHOD_CHOICES = [
        (METHOD_STRIPE, 'Stripe'),
        (METHOD_KASPI, 'Kaspi Pay'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'В обработке'),
        (STATUS_COMPLETED, 'Завершён'),
        (STATUS_FAILED, 'Ошибка'),
        (STATUS_REFUNDED, 'Возвращён'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments'
    )
    ticket = models.OneToOneField(
        'tickets.Ticket', on_delete=models.CASCADE, related_name='payment', null=True, blank=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    mock_transaction_id = models.UUIDField(default=uuid.uuid4, editable=False)
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f'Платёж {self.mock_transaction_id} ({self.status})'
