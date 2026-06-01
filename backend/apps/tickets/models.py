import uuid
from django.db import models
from django.conf import settings


class TicketType(models.Model):
    TIER_VIP = 'vip'
    TIER_STANDARD = 'standard'
    TIER_EARLY_BIRD = 'early_bird'
    TIER_CHOICES = [
        (TIER_VIP, 'VIP'),
        (TIER_STANDARD, 'Стандарт'),
        (TIER_EARLY_BIRD, 'Ранняя пташка'),
    ]

    event = models.ForeignKey(
        'events.Event', on_delete=models.CASCADE, related_name='ticket_types'
    )
    name = models.CharField(max_length=100)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_STANDARD)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Тип билета'
        verbose_name_plural = 'Типы билетов'

    def __str__(self):
        return f'{self.event.title} — {self.name}'

    @property
    def sold_count(self):
        return self.tickets.filter(status=Ticket.STATUS_ACTIVE).count()

    @property
    def available(self):
        return max(0, self.quantity - self.sold_count)


class Ticket(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_USED = 'used'
    STATUS_CANCELLED = 'cancelled'
    STATUS_REFUNDED = 'refunded'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Активный'),
        (STATUS_USED, 'Использован'),
        (STATUS_CANCELLED, 'Отменён'),
        (STATUS_REFUNDED, 'Возвращён'),
    ]

    ticket_type = models.ForeignKey(TicketType, on_delete=models.CASCADE, related_name='tickets')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets'
    )
    unique_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)
    purchased_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    class Meta:
        verbose_name = 'Билет'
        verbose_name_plural = 'Билеты'

    def __str__(self):
        return f'Билет #{self.unique_code} — {self.ticket_type}'

    def generate_qr(self):
        """Generate and save a QR code image for this ticket."""
        import qrcode
        import io
        from django.core.files.base import ContentFile

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(str(self.unique_code))
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        self.qr_code.save(f'qr_{self.unique_code}.png', ContentFile(buf.getvalue()), save=False)
