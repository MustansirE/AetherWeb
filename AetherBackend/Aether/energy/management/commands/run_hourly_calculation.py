from django.core.management.base import BaseCommand
from energy.energy_views import hourly_calculation  # Import your function

class Command(BaseCommand):
    help = 'Runs the hourly energy calculation'

    def handle(self, *args, **kwargs):
        hourly_calculation()
        self.stdout.write(self.style.SUCCESS('Hourly calculation executed successfully'))
