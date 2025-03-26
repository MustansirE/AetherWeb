from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import EmailVerificationToken

@receiver(post_save, sender=User)
def create_verification_token(sender, instance, created, **kwargs):
    if created:
        EmailVerificationToken.objects.create(user=instance)