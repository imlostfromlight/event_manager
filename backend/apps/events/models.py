import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji or icon name')
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'

    def __str__(self):
        return self.name


class Event(models.Model):
    TYPE_ONLINE = 'online'
    TYPE_OFFLINE = 'offline'
    TYPE_CHOICES = [(TYPE_ONLINE, 'Онлайн'), (TYPE_OFFLINE, 'Оффлайн')]

    FORMAT_FREE = 'free'
    FORMAT_PAID = 'paid'
    FORMAT_CHOICES = [(FORMAT_FREE, 'Бесплатное'), (FORMAT_PAID, 'Платное')]

    VISIBILITY_PUBLIC = 'public'
    VISIBILITY_PRIVATE = 'private'
    VISIBILITY_CHOICES = [(VISIBILITY_PUBLIC, 'Публичное'), (VISIBILITY_PRIVATE, 'По ссылке')]

    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_CANCELLED = 'cancelled'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Черновик'),
        (STATUS_PUBLISHED, 'Опубликовано'),
        (STATUS_CANCELLED, 'Отменено'),
        (STATUS_COMPLETED, 'Завершено'),
    ]

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='events'
    )
    cover_image = models.ImageField(upload_to='event_covers/', null=True, blank=True)

    event_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_OFFLINE)
    event_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default=FORMAT_FREE)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default=VISIBILITY_PUBLIC)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_DRAFT)

    # Offline location
    place = models.CharField(max_length=300, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    # Online meeting — auto-generated Jitsi room
    meeting_link = models.URLField(blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    participant_limit = models.PositiveIntegerField(null=True, blank=True)

    # UUID used to build private sharing link
    private_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Мероприятие'
        verbose_name_plural = 'Мероприятия'
        ordering = ['-start_time']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate Jitsi Meet link for online events
        if self.event_type == self.TYPE_ONLINE and not self.meeting_link:
            self.meeting_link = f'https://meet.jit.si/event-{self.private_token}'
        super().save(*args, **kwargs)

    @property
    def registrations_count(self):
        return self.registrations.filter(status=EventRegistration.STATUS_REGISTERED).count()

    @property
    def map_link(self):
        if self.latitude and self.longitude:
            return f'https://2gis.ru/geo/{self.longitude},{self.latitude}'
        return ''


class EventRegistration(models.Model):
    STATUS_REGISTERED = 'registered'
    STATUS_CANCELLED = 'cancelled'
    STATUS_ATTENDED = 'attended'
    STATUS_CHOICES = [
        (STATUS_REGISTERED, 'Зарегистрирован'),
        (STATUS_CANCELLED, 'Отменён'),
        (STATUS_ATTENDED, 'Посетил'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default=STATUS_REGISTERED)

    class Meta:
        unique_together = ['user', 'event']
        verbose_name = 'Регистрация'
        verbose_name_plural = 'Регистрации'

    def __str__(self):
        return f'{self.user} → {self.event}'


class Comment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} on {self.event}'


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'event']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'


class Report(models.Model):
    REASON_SPAM = 'spam'
    REASON_INAPPROPRIATE = 'inappropriate'
    REASON_MISLEADING = 'misleading'
    REASON_OTHER = 'other'
    REASON_CHOICES = [
        (REASON_SPAM, 'Спам'),
        (REASON_INAPPROPRIATE, 'Неприемлемый контент'),
        (REASON_MISLEADING, 'Вводит в заблуждение'),
        (REASON_OTHER, 'Другое'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        unique_together = ['user', 'event']
        verbose_name = 'Жалоба'
        verbose_name_plural = 'Жалобы'


class FavoriteEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='favorited_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'event']
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'
