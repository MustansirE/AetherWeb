from django.db import models
from devices.models import Room, Device


class AmbianceMode(models.Model):
    room = models.ForeignKey(Room, related_name='modes', on_delete=models.CASCADE)
    name = models.CharField(max_length=100) 
    status = models.CharField(max_length=50, choices=[('on', 'On'), ('off', 'Off')], default='off')  

    def __str__(self):
        return f"{self.name} mode for {self.room.name}"


class AmbianceModeDevice(models.Model):
    mode = models.ForeignKey(AmbianceMode, related_name='devices', on_delete=models.CASCADE)
    device = models.ForeignKey(Device, related_name='controlled_by_mode', on_delete=models.CASCADE)
    state = models.CharField(max_length=100, default=' ')
    prev_status = models.CharField(max_length=100, default=' ')
    prev_state = models.CharField(max_length=100, default=' ')

    def __str__(self):
        return f"{self.device.name} in {self.mode.name} mode"