from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from energy.models import UserEnergyUsage, DeviceEnergyUsage, IntervalReading, EnergyGoal
from users.models import Owner
from devices.models import Device
import random
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Generates sample data for energy usage'

    def handle(self, *args, **kwargs):
        user = Owner.objects.get(user__email='janedoe@email.com')
        today = timezone.now().date()

        # Generate DeviceEnergyUsage for each device
        devices = Device.objects.filter(room__house__owner=user)
        for device in devices:
            avg_kwh = device.average_energy_consumption_per_hour

            # Hourly data for today
            for hour in range(24):
                time_factor = 1 - abs(hour - 12) / 12  # Bell curve peak at 12
                usage = avg_kwh * time_factor * random.uniform(0.8, 1.2)
                timestamp = timezone.make_aware(datetime.combine(today, datetime.min.time()) + timedelta(hours=hour))
                DeviceEnergyUsage.objects.create(
                    device=device,
                    creation_timestamp=timestamp,
                    total_consumption=Decimal(usage).quantize(Decimal('0.01')),
                    period='hourly'
                )

            # Daily data for the current week
            start_of_week = today - timedelta(days=today.weekday())
            for day in range(7):
                day_date = start_of_week + timedelta(days=day)
                weekend_factor = 0.7 if day >= 5 else 1.0
                usage = avg_kwh * 24 * weekend_factor * random.uniform(0.9, 1.1)
                timestamp = timezone.make_aware(datetime.combine(day_date, datetime.min.time()))
                DeviceEnergyUsage.objects.create(
                    device=device,
                    creation_timestamp=timestamp,
                    total_consumption=Decimal(usage).quantize(Decimal('0.01')),
                    period='daily'
                )

            # Monthly data for each month
            current_year = today.year
            for month in range(1, 13):
                next_month = month + 1 if month < 12 else 1
                next_year = current_year if month < 12 else current_year + 1
                days_in_month = (datetime(next_year, next_month, 1) - datetime(current_year, month, 1)).days
                seasonal_factor = 1.3 if month in [1, 2, 6, 7, 8, 12] else 1.0
                usage = avg_kwh * 24 * days_in_month * seasonal_factor * random.uniform(0.9, 1.1)
                timestamp = timezone.make_aware(datetime(current_year, month, 1))
                DeviceEnergyUsage.objects.create(
                    device=device,
                    creation_timestamp=timestamp,
                    total_consumption=Decimal(usage).quantize(Decimal('0.01')),
                    period='monthly'
                )

            # Yearly data for past 5 years and current
            for year_offset in range(6):
                year = today.year - 5 + year_offset
                yearly_growth = 1.0 + year_offset * 0.05
                usage = avg_kwh * 24 * 365 * yearly_growth * random.uniform(0.95, 1.05)
                timestamp = timezone.make_aware(datetime(year, 1, 1))
                DeviceEnergyUsage.objects.create(
                    device=device,
                    creation_timestamp=timestamp,
                    total_consumption=Decimal(usage).quantize(Decimal('0.01')),
                    period='yearly'
                )

        # Aggregate DeviceEnergyUsage to create UserEnergyUsage
        for period in ['hourly', 'daily', 'monthly', 'yearly']:
            aggregates = DeviceEnergyUsage.objects.filter(
                device__room__house__owner=user,
                period=period
            ).values('creation_timestamp').annotate(total=Sum('total_consumption'))

            for agg in aggregates:
                UserEnergyUsage.objects.create(
                    homeowner=user,
                    creation_timestamp=agg['creation_timestamp'],
                    total_consumption=agg['total'],
                    period=period
                )

        # Generate IntervalReadings (existing code)
        for device in devices:
            device_baseline = random.uniform(0.1, 1.0)
            for hour in range(24):
                time_factor = 1 + 2 * (1 - abs(hour - 12) / 12)
                usage = Decimal(device_baseline * time_factor * random.uniform(0.9, 1.1))
                IntervalReading.objects.create(
                    device_id=device.device_id,
                    homeowner=user,
                    start=timezone.make_aware(datetime.combine(today, datetime.min.time())) + timedelta(hours=hour),
                    end=timezone.make_aware(datetime.combine(today, datetime.min.time()) + timedelta(hours=hour + 1)),
                    usage=usage.quantize(Decimal('0.01'))
                )

        # Set energy goal
        EnergyGoal.objects.update_or_create(
            homeowner=user,
            defaults={'goal': Decimal('500.00')}
        )

        self.stdout.write(self.style.SUCCESS('Successfully generated sample data'))