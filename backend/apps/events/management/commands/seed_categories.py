from django.core.management.base import BaseCommand
from apps.events.models import Category

CATEGORIES = [
    {'name': 'Образование',     'icon': '🎓', 'slug': 'education'},
    {'name': 'Спорт',           'icon': '🏋️', 'slug': 'sport'},
    {'name': 'Бизнес',          'icon': '💼', 'slug': 'business'},
    {'name': 'Развлечения',     'icon': '🎭', 'slug': 'entertainment'},
    {'name': 'Музыка',          'icon': '🎵', 'slug': 'music'},
    {'name': 'Технологии',      'icon': '💻', 'slug': 'tech'},
    {'name': 'Искусство',       'icon': '🎨', 'slug': 'art'},
    {'name': 'Еда и напитки',   'icon': '🍕', 'slug': 'food'},
    {'name': 'Здоровье',        'icon': '🧘', 'slug': 'health'},
    {'name': 'Наука',           'icon': '🔬', 'slug': 'science'},
]


class Command(BaseCommand):
    help = 'Seed default event categories'

    def handle(self, *args, **kwargs):
        created = 0
        for cat in CATEGORIES:
            _, is_new = Category.objects.get_or_create(slug=cat['slug'], defaults=cat)
            if is_new:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'Done. Created {created} categories.'))
