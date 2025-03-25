from django.apps import AppConfig


class RoutinesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'routines'

class YourAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'your_app'

    def ready(self):
        from .routine_views import start_scheduler
        start_scheduler()