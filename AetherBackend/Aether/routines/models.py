from django.db import models
from devices.models import House, Device

class Automation(models.Model):
    name = models.CharField(max_length=255)
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='automations', default=1)  # Replace 1 with the ID of your default house
    start_time = models.TimeField(default='00:00') # Start time for the routine
    end_time = models.TimeField(default='00:01')  # End time for the routine with a default value
    status = models.BooleanField(default=False)  # Active/inactive status
    is_running = models.BooleanField(default=False)  # Add this field
    last_triggered = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Automation: {self.name} (House: {self.house.house_id})"

class AutomationDevice(models.Model):
    automation = models.ForeignKey(Automation, related_name='devices', on_delete=models.CASCADE)
    device = models.ForeignKey(Device, related_name='controlled_by_automation', on_delete=models.CASCADE)
    state = models.CharField(max_length=100, default=' ')
    status = models.BooleanField(default=False)
    prev_status = models.CharField(max_length=100, default=' ')
    prev_state = models.CharField(max_length=100, default=' ')

    def __str__(self):
        return f"{self.device.name} in {self.automation.name}"