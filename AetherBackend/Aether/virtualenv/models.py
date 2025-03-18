from django.db import models

class VirtualEnv(models.Model):
    name = models.CharField(max_length=255)
    temperature_condition = models.DecimalField(max_digits=10, decimal_places=2) 
    humidity_condition = models.DecimalField(max_digits=10, decimal_places=2) 
    light_condition = models.DecimalField(max_digits=10, decimal_places=2) 
    
    def __str__(self):
        return f"{self.name} Virtual Environment"
    