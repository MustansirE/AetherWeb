from django.db import models
from django.contrib.auth.models import User

class Owner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    plan_type = models.CharField(max_length=8, default="Home")
    house_id = models.BigIntegerField(default=0)
    
    def __str__(self):
        return f"Owner: {self.user.first_name} {self.user.last_name if self.user else ''}"
    
class Guest(models.Model):
    owner = models.ForeignKey('users.Owner', on_delete=models.CASCADE)  # Use string references for avoiding circular imports
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    code = models.CharField(max_length=20, unique=True)
    house_id = models.BigIntegerField(default=0)
    allowed_rooms = models.ManyToManyField('devices.Room', related_name='guests')  # Use string references here
    departure_date = models.DateField(null=True, blank=True)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Guest of {self.owner.user.first_name}: {self.user.first_name} {self.user.last_name if self.user else ''}"




