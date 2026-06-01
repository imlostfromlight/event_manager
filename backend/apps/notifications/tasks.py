from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=3)
def send_registration_email(self, user_id, event_id):
    from django.contrib.auth import get_user_model
    from apps.events.models import Event

    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        event = Event.objects.get(id=event_id)
    except (User.DoesNotExist, Event.DoesNotExist):
        return

    subject = f'Вы зарегистрированы на «{event.title}»'
    message = (
        f'Привет, {user.full_name}!\n\n'
        f'Вы успешно зарегистрировались на мероприятие «{event.title}».\n\n'
        f'Дата и время: {event.start_time.strftime("%d.%m.%Y %H:%M")}\n'
    )
    if event.event_type == 'online' and event.meeting_link:
        message += f'Ссылка на онлайн-встречу: {event.meeting_link}\n'
    elif event.place:
        message += f'Место: {event.place}\n'
        if event.latitude and event.longitude:
            message += f'Карта: {event.map_link}\n'

    message += f'\nДо встречи!\nКоманда Event Manager'

    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_event_reminder(self, event_id):
    """Send reminder email 1 day before event to all registered participants."""
    from apps.events.models import Event, EventRegistration

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return

    regs = EventRegistration.objects.filter(
        event=event, status=EventRegistration.STATUS_REGISTERED
    ).select_related('user')

    for reg in regs:
        user = reg.user
        subject = f'Напоминание: «{event.title}» — завтра!'
        message = (
            f'Привет, {user.full_name}!\n\n'
            f'Напоминаем, что завтра состоится мероприятие «{event.title}».\n'
            f'Начало: {event.start_time.strftime("%d.%m.%Y %H:%M")}\n'
        )
        if event.meeting_link:
            message += f'Ссылка: {event.meeting_link}\n'
        elif event.place:
            message += f'Место: {event.place}\n'
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        except Exception:
            pass
