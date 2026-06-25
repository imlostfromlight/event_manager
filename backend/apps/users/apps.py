from django.apps import AppConfig
from django.db.backends.signals import connection_created


def _enable_sqlite_wal(sender, connection, **kwargs):
    """Enable WAL + busy timeout so concurrent reads/writes don't raise
    'database is locked' on SQLite."""
    if connection.vendor == 'sqlite':
        cursor = connection.cursor()
        cursor.execute('PRAGMA journal_mode=WAL;')
        cursor.execute('PRAGMA synchronous=NORMAL;')
        cursor.execute('PRAGMA busy_timeout=20000;')


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Пользователи'

    def ready(self):
        connection_created.connect(_enable_sqlite_wal)
