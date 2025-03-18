from django.db import models

class AmbianceMode(models.Model):
    name = models.CharField(max_length=255)
    status = models.BooleanField(default=False)
    room = models.ForeignKey('devices.Room', on_delete=models.CASCADE, related_name='ambiance_modes')
    devices = models.ManyToManyField('devices.Device', related_name='ambiance_modes', blank=True)

    previous_states = models.JSONField(default=list)  
    previous_status = models.JSONField(default=list)  
    current_states = models.JSONField(default=list)   
    current_status = models.JSONField(default=list)  
