from django.db import models
from users.models import User  

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  
    message = models.CharField(max_length=500)
    type = models.CharField(max_length=50, choices=[('VE', 'VE'), ('alert', 'alert')], default='general')
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} Notification for {self.user} at {self.created_at}"
