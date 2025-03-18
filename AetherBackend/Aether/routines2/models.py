from django.db import models
from devices.models import House, Device

class Automation(models.Model):
    house_id = models.BigIntegerField(default=0)
    name = models.CharField(max_length=255)
    status = models.BooleanField(default=False)

    def __str__(self):
        return f"Automation: {self.name} (Room: {self.room.name})"
    
class AutomationDevice(models.Model):
    automation = models.ForeignKey(Automation, related_name='devices', on_delete=models.CASCADE)
    device = models.ForeignKey(Device, related_name='controlled_by_automation', on_delete=models.CASCADE)
    state = models.CharField(max_length=100, default=' ')
    status = models.BooleanField(default=False)
    prev_status = models.CharField(max_length=100, default=' ')
    prev_state = models.CharField(max_length=100, default=' ')

    def __str__(self):
        return f"{self.device.name} in {self.automation.name}"