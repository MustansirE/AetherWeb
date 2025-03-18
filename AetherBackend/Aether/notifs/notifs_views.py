from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Notification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:5]
    data = [{
        'message': notification.message,
        'type': notification.type,
        'created_at': notification.created_at,
        'is_read': notification.is_read,
    } for notification in notifications]
    return JsonResponse(data, safe=False)