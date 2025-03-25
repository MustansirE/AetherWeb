from django.db import models
from users.models import Owner
from devices.models import Device


class EnergyGoal(models.Model):
    homeowner = models.OneToOneField(Owner, on_delete=models.CASCADE, related_name='energy_goal')
    goal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.homeowner.user.first_name}'s Energy Goal: {self.goal} kWh"

class UserEnergyUsage(models.Model):
    homeowner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='energy_usages')
    creation_timestamp = models.DateTimeField()
    total_consumption = models.DecimalField(max_digits=10, decimal_places=2) 
    period = models.CharField(max_length=10, choices=[('hourly', 'Hourly'), ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')])

    def __str__(self):
        return f"{self.homeowner.user.first_name}'s {self.period.capitalize()} Energy Usage: {self.total_consumption} kWh"

class DeviceEnergyUsage(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='energy_usages')
    creation_timestamp = models.DateTimeField()
    total_consumption = models.DecimalField(max_digits=10, decimal_places=2) 
    period = models.CharField(max_length=10, choices=[('hourly', 'Hourly'), ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')])

    def __str__(self):
        return f"{self.device.room.house.owner.user.first_name}'s {self.period.capitalize()} Energy Usage: {self.total_consumption} kWh"

class IntervalReading(models.Model):
    device_id = models.CharField(max_length=255)
    homeowner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='interval_readings')
    start = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    usage = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  

    def __str__(self):
        return f"Reading for Device {self.device_id} from {self.start} to {self.end} - {self.usage} kWh"

# energy/models.py
class CommunityEvent(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    participants = models.ManyToManyField(
        Owner, 
        related_name='joined_events',
        blank=True
    )

    def __str__(self):
        return self.name