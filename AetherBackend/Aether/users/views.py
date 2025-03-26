from django.contrib.auth.models import User
from django.http import JsonResponse
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import EmailVerificationToken

def verify_email(request, token):
    token_obj = get_object_or_404(EmailVerificationToken, token=token)
    if token_obj.is_valid():
        token_obj.is_verified = True
        token_obj.save()
        user = token_obj.user
        user.is_active = True  # Activate the user account
        user.save()
        return JsonResponse({'message': 'Email verified successfully.'})
    return JsonResponse({'error': 'Invalid or expired token.'}, status=400)
def signup(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False  # Deactivate account until email is verified
        user.save()

        # Send verification email
        token = EmailVerificationToken.objects.get(user=user)
        verification_link = f"http://yourdomain.com/verify-email/{token.token}/"
        send_mail(
            'Verify Your Email',
            f'Click the link to verify your email: {verification_link}',
            'noreply@yourdomain.com',
            [email],
            fail_silently=False,
        )
        return JsonResponse({'message': 'User created. Please verify your email.'})
    
    