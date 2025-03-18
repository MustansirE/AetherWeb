import logging
from django.shortcuts import render, get_object_or_404, redirect

from devices.device_views import toggle_device
from .models import AmbianceMode, AmbianceModeDevice
from devices.models import House, Room, Device, FixedOptionDevice, VariableOptionDevice
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.http import JsonResponse


logger = logging.getLogger(__name__)  

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def modes_list(request):
    try:
        logger.info(f"Request received from user: {request.user}")

        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            logger.error("User is not associated with a house")
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        house = get_object_or_404(House, house_id=request.user.owner.house_id)
        logger.info(f"House found: {house}")

        # Get all rooms with supported devices
        rooms = Room.objects.filter(
            house=house,
            devices__general_product_code__in=['AF0005', 'AF0003', 'LF0002', 'AV0001']
        ).distinct().prefetch_related('devices')

        logger.info(f"Rooms found: {rooms.count()}")

        # Fetch ambiance modes linked to those rooms
        ambiance_modes = AmbianceMode.objects.filter(room__in=rooms).select_related('room')

        logger.info(f"Ambiance modes found: {ambiance_modes.count()}")

        # Format the response
        modes_data = []
        for mode in ambiance_modes:
            try:
                mode_devices = AmbianceModeDevice.objects.filter(mode=mode).select_related('device')
                devices_data = [
                    {
                        "deviceId": str(md.device.device_id),
                        "deviceName": md.device.name,
                        "state": md.state,
                        "prevState": md.prev_state,
                    }
                    for md in mode_devices
                ]

                modes_data.append({
                    "id": str(mode.id),
                    "name": mode.name,
                    "roomId": str(mode.room.room_id),
                    "roomName": mode.room.name,
                    "isActive": mode.status == 'on',
                    "devices": devices_data,
                })
            except Exception as device_error:
                logger.error(f"Error processing devices for mode {mode.id}: {device_error}")

        rooms_data = [
            {
                "id": str(room.room_id),
                "name": room.name,
            }
            for room in rooms
        ]
        print(modes_data)
        return JsonResponse({"ambiance_modes": modes_data, "rooms": rooms_data})

    except Exception as e:
        logger.error(f"Unexpected server error: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_devices(request, room_id):
    # Fetch the room using `room_id`
    room = get_object_or_404(Room, room_id=room_id)

    # Get only supported devices in the room
    devices = room.devices.filter(
        general_product_code__in=['AF0005', 'AF0003', 'LF0002', 'AV0001']
    )

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_ambiance_mode(request):
    try:
        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        house = get_object_or_404(House, house_id=request.user.owner.house_id)

        # Get the room and validate it
        room_id = request.data.get('roomId')
        room = get_object_or_404(Room, room_id=room_id, house=house)

        # Create the ambiance mode
        mode = AmbianceMode.objects.create(
            room=room,
            name=request.data.get('name'),
            status='off'  # Default status
        )

        # Save device states for the mode
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['deviceId'])
            AmbianceModeDevice.objects.create(
                mode=mode,
                device=device,
                state=device_data['state'],
                prev_state=device_data['state'],  # Set initial state
                prev_status='off'  # Default previous status
            )
        print("Ambiance Mode added succesfully!")
        return JsonResponse({
            "message": "Ambiance mode created successfully",
            "modeId": mode.id
        }, status=201)

    except Exception as e:
        logger.error(f"Error creating ambiance mode: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_ambiance_mode(request, mode_id):
    try:
        # Ensure the user has an associated house
        if not hasattr(request.user, 'owner') or not request.user.owner.house_id:
            return JsonResponse({"error": "User is not associated with a house"}, status=400)

        # Get the mode to update
        mode = get_object_or_404(AmbianceMode, id=mode_id)

        # Update the mode name if provided
        if 'name' in request.data:
            mode.name = request.data['name']

        # Update the room if provided
        if 'roomId' in request.data:
            room = get_object_or_404(Room, room_id=request.data['roomId'])
            mode.room = room

        # Save the updated mode
        mode.save()

        # Update device states for the mode
        devices_data = request.data.get('devices', [])
        for device_data in devices_data:
            device = get_object_or_404(Device, device_id=device_data['deviceId'])
            ambiance_device, created = AmbianceModeDevice.objects.get_or_create(
                mode=mode,
                device=device,
                defaults={
                    'state': device_data['state'],
                    'prev_state': device_data['state'],
                    'prev_status': 'off'
                }
            )
            if not created:
                ambiance_device.state = device_data['state']
                ambiance_device.save()

        return JsonResponse({
            "message": "Ambiance mode updated successfully",
            "modeId": mode.id
        }, status=200)

    except Exception as e:
        logger.error(f"Error updating ambiance mode: {e}", exc_info=True)
        return JsonResponse({"error": "Internal Server Error"}, status=500)

def mode_details(request, mode_id):
    mode = get_object_or_404(AmbianceMode, id=mode_id)
    return render(request, 'mode_details.html', {'mode': mode})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_ambiance_mode(request, mode_id):
    mode = get_object_or_404(AmbianceMode, id=mode_id)
    mode.delete()
    return JsonResponse({'message': 'Ambiance mode deleted successfully'}, status=200)

@csrf_exempt
def toggle_ambiance(request, mode_id):
    mode = get_object_or_404(AmbianceMode, id=mode_id)

    if request.method == 'POST':
        if mode.status == 'off':  
            for ambiance_device in mode.devices.all():
                base_device = ambiance_device.device
                ambiance_device.prev_status = base_device.status

                fixed_device = FixedOptionDevice.objects.filter(device=base_device).first()
                variable_device = VariableOptionDevice.objects.filter(device=base_device).first()

                if fixed_device:
                    ambiance_device.prev_state = fixed_device.state.strip()  # Store previous state
                    fixed_device.state = ambiance_device.state.strip()  # Apply new state
                    fixed_device.save()

                elif variable_device:
                    ambiance_device.prev_state = str(variable_device.state) if variable_device.state is not None else "0"
                    variable_device.state = ambiance_device.state  # Apply new state
                    variable_device.save()

                base_device.status = 'on'
                base_device.save()
                ambiance_device.save()

            mode.status = 'on'

        else:  # Turning ambiance mode OFF
            for ambiance_device in mode.devices.all():
                base_device = ambiance_device.device
                base_device.status = ambiance_device.prev_status  # Restore previous status

                fixed_device = FixedOptionDevice.objects.filter(device=base_device).first()
                variable_device = VariableOptionDevice.objects.filter(device=base_device).first()

                if fixed_device:
                    fixed_device.state = ambiance_device.prev_state.strip()  # Restore previous state
                    fixed_device.save()

                elif variable_device:
                    variable_device.state = int(ambiance_device.prev_state) if ambiance_device.prev_state.isdigit() else 0
                    variable_device.save()

                base_device.save()
                ambiance_device.save()

            mode.status = 'off'

        mode.save()
        return JsonResponse({'success': True, 'mode_status': mode.status})

    return JsonResponse({'error': 'Invalid request method'}, status=400)