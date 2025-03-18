# views.py
import logging
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import Automation, AutomationDevice
from devices.models import House, Device

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def automations_list(request):
    try:
        logger.info(f"Request received from user: {request.user}")

        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            logger.error("User is not associated with a house")
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        house = get_object_or_404(House, house_id=request.user.owner.house_id)
        logger.info(f"House found: {house}")

        # Fetch all automations linked to the house
        automations = Automation.objects.filter(house=house).prefetch_related('devices')

        logger.info(f"Automations found: {automations.count()}")

        # Format the response
        automations_data = []
        for automation in automations:
            automation_devices = AutomationDevice.objects.filter(automation=automation).select_related('device')
            devices_data = [
                {
                    "deviceId": str(ad.device.device_id),
                    "deviceName": ad.device.name,
                    "state": ad.state,
                    "status": ad.status,
                }
                for ad in automation_devices
            ]

            automations_data.append({
                "id": str(automation.id),
                "name": automation.name,
                "startTime": automation.start_time,
                "endTime": automation.end_time,
                "status": automation.status,
                "devices": devices_data,
            })
        print(automations_data)
        return JsonResponse({"automations": automations_data}, status=200)

    except Exception as e:
        logger.error(f"Unexpected server error: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)

# views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_automation(request):
    try:
        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        house = get_object_or_404(House, house_id=request.user.owner.house_id)

        # Create the automation
        automation = Automation.objects.create(
            house=house,
            name=request.data.get('name'),
            start_time=request.data.get('startTime'),
            end_time=request.data.get('endTime'),
            status=False  # Default status
        )

        # Save device states for the automation
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['deviceId'])
            AutomationDevice.objects.create(
                automation=automation,
                device=device,
                state=device_data['state'],
                status=device_data['status'],
            )
        print("Automation created succesfully!")
        return JsonResponse({
            "message": "Automation created successfully",
            "automationId": automation.id
        }, status=201)

    except Exception as e:
        logger.error(f"Error creating automation: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)

# views.py
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_automation(request, automation_id):
    try:
        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        # Get the automation to update
        automation = get_object_or_404(Automation, id=automation_id)

        # Update the automation fields if provided
        if 'name' in request.data:
            automation.name = request.data['name']
        if 'startTime' in request.data:
            automation.start_time = request.data['startTime']
        if 'endTime' in request.data:
            automation.end_time = request.data['endTime']

        # Save the updated automation
        automation.save()

        # Update device states for the automation
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['deviceId'])
            automation_device, created = AutomationDevice.objects.get_or_create(
                automation=automation,
                device=device,
                defaults={
                    'state': device_data['state'],
                    'status': device_data['status'],
                }
            )
            if not created:
                automation_device.state = device_data['state']
                automation_device.status = device_data['status']
                automation_device.save()
        print("Automation edited succesfully!")
        return JsonResponse({
            "message": "Automation updated successfully",
            "automationId": automation.id
        }, status=200)

    except Exception as e:
        logger.error(f"Error updating automation: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)
    
# views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_automation(request, automation_id):
    try:
        automation = get_object_or_404(Automation, id=automation_id)
        automation.status = not automation.status
        automation.save()
        print("Automation toggled succesfully!")
        return JsonResponse({
            "message": "Automation toggled successfully",
            "newStatus": automation.status
        }, status=200)
    except Exception as e:
        logger.error(f"Error toggling automation: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)


# views.py
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_automation(request, automation_id):
    try:
        automation = get_object_or_404(Automation, id=automation_id)
        automation.delete()
        print("Automation deleted succesfully!")
        return JsonResponse({'message': 'Automation deleted successfully'}, status=200)
    except Exception as e:
        logger.error(f"Error deleting automation: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)

