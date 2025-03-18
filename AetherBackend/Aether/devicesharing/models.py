from datetime import timedelta
from django.db import models
from django.utils import timezone  # Import Django's timezone utility
from devices.models import Device
from users.models import Owner

class Listing(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    condition = models.CharField(
        max_length=50,
        choices=[('old', 'Old'), ('new', 'New'), ('average', 'Average')],
        default='average'
    )
    has_requested = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Listing for {self.device.name} by {self.owner.user.first_name}"

def default_due_date():
    return timezone.now() + timedelta(days=7)

class Request(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    user = models.ForeignKey(Owner, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=50,
        choices=[('pending', 'Pending'), ('active', 'Active')],
        default='pending'
    )
    due_date = models.DateTimeField(default=default_due_date)
    
    def __str__(self):
        return f"Request by {self.user.user.first_name} for {self.listing.device.name}"
