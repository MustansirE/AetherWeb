# views.py
import logging
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import Automation, AutomationDevice
from devices.models import FixedOptionDevice, House, Room, Device, VariableOptionDevice

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rooms_list(request):
    try:
        logger.info(f"Request received from user: {request.user}")

        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            logger.error("User is not associated with a house")
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        # Fetch the house associated with the user
        house = get_object_or_404(House, house_id=request.user.owner.house_id)
        logger.info(f"House found: {house}")

        # Fetch all rooms in the house
        rooms = Room.objects.filter(house=house)
        logger.info(f"Rooms found: {rooms.count()}")

        # Format the response
        rooms_data = [
            {
                "id": str(room.room_id),
                "name": room.name,
            }
            for room in rooms
        ]

        return JsonResponse({"rooms": rooms_data}, status=200)

    except Exception as e:
        logger.error(f"Unexpected server error: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)

from datetime import datetime

def is_automation_active(start_time, end_time):
    now = datetime.now().time()
    return start_time <= now <= end_time

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
            # Fetch devices for the automation
            automation_devices = automation.devices.all()  # Use the related_name 'devices'
            devices_data = [
                {
                    "deviceId": str(ad.device.device_id),
                    "deviceName": ad.device.name,  # Include device name
                    "roomName": ad.device.room.name if ad.device.room else "Unknown Room",  # Include room name
                    "state": ad.state,
                    "status": ad.status,
                }
                for ad in automation_devices
            ]

        # views.py (in automations_list)
        # Change the isActive field to use is_running
        automations_data.append({
            "id": str(automation.id),
            "name": automation.name,
            "startTime": automation.start_time.strftime('%H:%M'),
            "endTime": automation.end_time.strftime('%H:%M'),
            "status": automation.status,
            "isActive": automation.is_running,  # Changed here
            "devices": devices_data,
        })

        print(automations_data)  # Debugging: Log the automations data
        return JsonResponse({"automations": automations_data}, status=200)

    except Exception as e:
        logger.error(f"Unexpected server error: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_alldevices(request, room_id):
    # Fetch the room using `room_id`
    room = get_object_or_404(Room, room_id=room_id)

    # Get ALL devices in the room (no filters)
    devices = room.devices.all()

    # Structure the response
    devices_data = []
    for device in devices:
        device_type = device.get_device_type()
        state = None
        options = None

        # Determine the state based on the device type
        if device_type == "Fixed":
            fixed_device = FixedOptionDevice.objects.filter(device=device).first()
            if fixed_device:
                state = fixed_device.state
                options = fixed_device.options  # If options exist
            device_type = "FixedOption"  # Map to frontend's expected type

        elif device_type == "Variable":
            variable_device = VariableOptionDevice.objects.filter(device=device).first()
            if variable_device:
                state = variable_device.state  # This is an integer
            device_type = "VariableOption"  # Map to frontend's expected type

        elif device_type == "Toggle":
            # Toggle devices only have an on/off state
            state = "on" if device.status == "on" else "off"
            device_type = "Toggle"  # Map to frontend's expected type

        # Convert options from string to array if necessary
        if options and isinstance(options, str):
            try:
                options = eval(options)  # Convert string to list
            except:
                options = []  # Fallback to empty list if conversion fails

        # Append structured device data
        devices_data.append({
            "deviceId": device.device_id,
            "deviceName": device.name,
            "type": device_type,
            "options": options,  # Ensure this is an array
            "state": state,
            "general_product_code": device.general_product_code,
        })

    print(devices_data)  # Debugging: Log the devices data
    return JsonResponse(devices_data, safe=False)

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
            name=request.data.get('name'),
            house=house,  # Link to the house
            start_time=request.data.get('start_time'),  # Start time
            end_time=request.data.get('end_time'),  # End time
            status=False  # Default status
        )

        # Save device states for the automation
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['device_id'])
            AutomationDevice.objects.create(
                automation=automation,
                device=device,
                state=device_data['state'],
                status=device_data['status'],
            )
        print("Routine added succesfully")
        return JsonResponse({
            "message": "Automation created successfully",
            "automationId": automation.id
        }, status=201)

    except Exception as e:
        logger.error(f"Error creating automation: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)

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
        if 'start_time' in request.data:
            automation.start_time = request.data['start_time']
        if 'end_time' in request.data:
            automation.end_time = request.data['end_time']

        # Save the updated automation
        automation.save()

        # Update device states for the automation
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['device_id'])
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
        
        # Immediate execution for manual toggling
        if automation.status:
            execute_automation(automation, activate=True)
            automation.is_running = True
        else:
            execute_automation(automation, activate=False)
            automation.is_running = False
            
        automation.save()
        print("Automation started!")
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


# automation_scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from django.utils import timezone
from .models import Automation, AutomationDevice
from devices.models import FixedOptionDevice, VariableOptionDevice

def execute_automation(automation, activate=True):
    for automation_device in automation.devices.all():
        device = automation_device.device
        
        if activate:
            # Store original state
            automation_device.prev_status = device.status
            if hasattr(device, 'fixedoptiondevice'):
                automation_device.prev_state = device.fixedoptiondevice.state
            elif hasattr(device, 'variableoptiondevice'):
                automation_device.prev_state = str(device.variableoptiondevice.state)
            automation_device.save()

            # Apply new state
            if automation_device.state:
                if hasattr(device, 'fixedoptiondevice'):
                    device.fixedoptiondevice.state = automation_device.state
                    device.fixedoptiondevice.save()
                elif hasattr(device, 'variableoptiondevice'):
                    device.variableoptiondevice.state = automation_device.state
                    device.variableoptiondevice.save()
            
            device.status = automation_device.status
            device.save()
        else:
            # Restore original state
            if automation_device.prev_state:
                if hasattr(device, 'fixedoptiondevice'):
                    device.fixedoptiondevice.state = automation_device.prev_state
                    device.fixedoptiondevice.save()
                elif hasattr(device, 'variableoptiondevice'):
                    device.variableoptiondevice.state = automation_device.prev_state
                    device.variableoptiondevice.save()
            
            device.status = automation_device.prev_status
            device.save()

def check_automations():
    now = timezone.now().time()
    for automation in Automation.objects.filter(status=True):
        try:
            start = automation.start_time
            end = automation.end_time
            time_in_range = start <= now <= end

            if time_in_range and not automation.is_running:
                execute_automation(automation, activate=True)
                automation.is_running = True
                automation.last_triggered = timezone.now()
                automation.save()

            elif not time_in_range and automation.is_running:
                execute_automation(automation, activate=False)
                automation.is_running = False
                automation.save()
                
        except Exception as e:
            print(f"Error processing automation {automation.id}: {str(e)}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), 'default')
    scheduler.add_job(
        check_automations,
        'interval',
        minutes=1,
        name='automation_check',
        replace_existing=True
    )
    scheduler.start()