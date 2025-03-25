# users/utils.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import EmailVerificationToken
import uuid
from django.conf import settings

def send_verification_email(user):
    # Create or get existing token
    token, created = EmailVerificationToken.objects.get_or_create(user=user)
    if not created and not token.is_valid():
        token.delete()
        token = EmailVerificationToken.objects.create(user=user)

    # Build verification URL
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token.token}/"
    
    # Render email template
    context = {
        'user': user,
        'verification_url': verification_url,
    }
    html_message = render_to_string('email/verification_email.html', context)
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        'Verify your Aether account',
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )