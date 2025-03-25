import datetime
from pathlib import Path
from django.shortcuts import render, get_object_or_404, redirect
from .models import House, Room, Device, FixedOptionDevice, VariableOptionDevice, MonitorFixedDevice, MonitorVariableDevice
from energy.models import IntervalReading
from django.contrib.auth.decorators import login_required
from users.user_views import generate_unique_code
from django.utils.crypto import get_random_string
import json
from django.http import JsonResponse
from django.utils.timezone import now
from decimal import Decimal
from simulation.tasks import run_simulation
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def roomsanddevices(request):
    try:
        house = House.objects.get(house_id=request.user.owner.house_id, owner=request.user.owner)
    except House.DoesNotExist:
        # If no house is found, return an empty response
        return JsonResponse({"rooms": []})

    rooms = house.rooms.all()
    room_counts = {}
    device_counts = {}

    device_options = {}
    updated_device_states = {}

    for room in rooms:
        for device in room.devices.all():
            # Determine device state based on its type
            if device.get_device_type() == 'Fixed':
                fixed_device = device.fixed_device.first()
                if fixed_device:
                    device_options[device.device_id] = fixed_device.options.split(", ")
                    updated_device_states[device.device_id] = fixed_device.state

            elif device.get_device_type() == 'MonitorFixed':
                monitorfixed_device = device.monitorfixed_device.first()
                if monitorfixed_device:
                    device_options[device.device_id] = monitorfixed_device.options.split(", ")
                    updated_device_states[device.device_id] = monitorfixed_device.state
                    
            elif device.get_device_type() == 'MonitorVariable':
                monitorvariable_device = device.monitorvariable_device.first()
                if monitorvariable_device:
                    device_options[device.device_id] = ['State (0-100)']  # Add relevant options
                    updated_device_states[device.device_id] = monitorvariable_device.state

            elif device.get_device_type() == 'Variable':
                variable_device = device.variable_device.first()
                if variable_device:
                    device_options[device.device_id] = ['State (0-100)']  # Add relevant options
                    updated_device_states[device.device_id] = variable_device.state

            # Track room and device counts for numbering
            room_counts[room.name] = room_counts.get(room.name, 0) + 1
            device_counts[device.general_product_code] = device_counts.get(device.general_product_code, 0) + 1

            room.room_number = room_counts[room.name]
            device.device_number = device_counts[device.general_product_code]
            room.save()
            device.save()

    # Get the latest device states (SimPy updates)
    updated_device_states.update({
        device.device_id: device.state
        for device in MonitorFixedDevice.objects.all()
    })
    updated_device_states.update({
        device.device_id: device.state
        for device in MonitorVariableDevice.objects.all()
    })

    # Format response with state and options
    room_data = []
    for room in rooms:
        devices = [
            {
                "device_id": device.device_id,
                "name": device.name,
                "general_product_code": device.general_product_code,
                "status": device.status,
                "device_type": device.get_device_type(),
                "state": updated_device_states.get(device.device_id, device.get_state()),  # Ensure latest state
                "options": device_options.get(device.device_id, [])
            }
            for device in room.devices.all()
        ]
        room_data.append({
            "room_id": room.room_id,
            "name": room.name,
            "devices": devices
        })

    return JsonResponse({"rooms": room_data})


def generate_unique_room_id():
    return get_random_string(8)  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def add_room(request):
    if request.method == 'POST':
        try:
            house = get_object_or_404(House, house_id=request.user.owner.house_id)
            data = json.loads(request.body)
            room_name = data.get('room_name', '').strip()  
            if not room_name:
                return JsonResponse({"error": "Room name is required."}, status=400)
            room_id = generate_unique_room_id()
            while house.rooms.filter(room_id=room_id).exists():
                room_id = generate_unique_room_id()
            last_room = house.rooms.filter(name=room_name).order_by('-room_number').first()
            room_number = last_room.room_number + 1 if last_room else 1
            room = Room.objects.create(name=room_name, house=house, room_id=room_id, room_number=room_number)
            print(f"Room '{room_name}' added successfully!")
            return JsonResponse({'message': 'Room added successfully'}, status=200)
        
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)
        except Exception as e:
            print(f"Error adding room: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
        
    return JsonResponse({"error": "Invalid request method"}, status=405)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def remove_room(request, room_id):
    if request.method == 'DELETE': 
        try:
            room = get_object_or_404(Room, room_id=room_id)
            room.delete()
            return JsonResponse({'message': 'Room deleted successfully'}, status=200)
        except Exception as e:
            print(f"Error deleting room: {e}")
            return JsonResponse({'error': 'An error occurred while deleting the room'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt # Use this if you don't want CSRF errors for testing (add CSRF token handling in the frontend)
def add_device(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)

    if request.method == 'POST':
        data = json.loads(request.body)

        general_product_code = data.get('general_product_code')

        json_file_path = Path(__file__).resolve().parent / 'devices.json'
        with open(json_file_path, 'r') as f:
            devices_data = json.load(f)

        device_data = next((d for d in devices_data if d['general_product_code'] == general_product_code), None)
        if not device_data:
            return JsonResponse({"error": "Invalid product code"}, status=400)

        device_id = generate_unique_code()
        while room.devices.filter(device_id=device_id).exists():  
            device_id = generate_unique_code()

        last_device = room.devices.filter(general_product_code=general_product_code).order_by('-device_number').first()
        device_number = last_device.device_number + 1 if last_device else 1  

        device = Device(
            device_id=device_id,
            name=device_data['name'],
            general_product_code=general_product_code,
            manufacturer=device_data.get('manufacturer', ''),
            average_energy_consumption_per_hour=device_data.get('average_energy_consumption_per_hour', 1),
            status='on',
            room=room,
            device_number=device_number  
        )
        device.save()
        
        device_type = device.get_device_type()

        if device_type == 'Fixed':
            options = device_data.get('options', [])  
            FixedOptionDevice.objects.create(
                device=device,
                options=options if options else '',
                state= 'none'
            )
        elif device_type == 'Variable':
            VariableOptionDevice.objects.create(
                device=device,
                state=25
            )
        elif device_type == 'MonitorFixed':
            options = device_data.get('options', ['default'])  
            MonitorFixedDevice.objects.create(
                device=device,
                options=options,
                state= options[0]  
            )
        elif device_type == 'MonitorVariable':
            MonitorVariableDevice.objects.create(
                device=device,
                state=25 
            )
        print("Devices added successfully!")
        return JsonResponse({'message': 'Device added successfully'}, status=200)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def remove_device(request, room_id, device_id):
    house = get_object_or_404(House, house_id=request.user.owner.house_id)
    device = get_object_or_404(Device, device_id=device_id, room__room_id=room_id, room__house=house)
    device.delete()
    return JsonResponse({'message': 'Device deleted successfully'}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def toggle_device(request, device_id):
    device = get_object_or_404(Device, device_id=device_id)
    
    if device.status == 'off':  
        # Turn device on and create IntervalReading
        IntervalReading.objects.create(
            device_id=device.device_id,
            homeowner=device.room.house.owner,  
            start=now() 
        )
        device.status = 'on'  
    else: 
        # Turn device off and close the interval
        interval = IntervalReading.objects.filter(
            device_id=device.device_id,
            end__isnull=True  
        ).first()

        if interval:  
            interval.end = now()  # End time for interval
            interval.usage = calculate_usage(interval)
            interval.save()
        device.status = 'off' 

    device.save()

    # Respond with a success message and the new device state
    return JsonResponse({
        'status': 'success',
        'device_id': device.device_id,
        'new_state': device.status  # Return the new state of the device
    })

def calculate_usage(interval):
    duration_in_hours = (interval.end - interval.start).total_seconds() / 3600
    device = Device.objects.get(device_id=interval.device_id)
    average_consumption = Decimal(device.average_energy_consumption_per_hour)
    usage = Decimal(duration_in_hours) * average_consumption
    return usage

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def update_device_state(request, device_id):
    device = get_object_or_404(Device, device_id=device_id)

    if device.status == 'on':
        try:
            data = json.loads(request.body)  # Get JSON data from frontend
            new_state = data.get('state')  # Extract new state

            if device.get_device_type() == 'Fixed':
                fixed_device = get_object_or_404(FixedOptionDevice, device=device)
                fixed_device.state = new_state
                fixed_device.save()

            elif device.get_device_type() == 'Variable':
                try:
                    new_state = int(new_state)  # Convert to int if needed
                    variable_device = get_object_or_404(VariableOptionDevice, device=device)
                    variable_device.state = new_state
                    variable_device.save()
                except ValueError:
                    return JsonResponse({"error": "Invalid state value"}, status=400)

            return JsonResponse({"success": True, "new_state": new_state})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Device must be on to update state"}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@login_required
@csrf_exempt
def device_info(request, device_id):
    device = get_object_or_404(Device, device_id=device_id)
    device_type = device.get_device_type()
    state = ''

    if device_type == 'Fixed':
        state = get_object_or_404(FixedOptionDevice, device=device).state
    elif device_type == 'Variable':
        state = get_object_or_404(VariableOptionDevice, device=device).state
    elif device_type == 'MonitorFixed':
        state = get_object_or_404(MonitorFixedDevice, device=device).state
    elif device_type == 'MonitorVariable':
        state = get_object_or_404(MonitorVariableDevice, device=device).state

    # Prepare JSON response
    data = {
        'name': device.name,
        'general_product_code': device.general_product_code,
        'manufacturer': device.manufacturer,
        'average_energy_consumption_per_hour': device.average_energy_consumption_per_hour,
        'device_type': device_type,
        'state': state,
    }

    return JsonResponse(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def adjust_thermostat(request):
    print("called")
    try:
        # Parse JSON data from the request body
        data = json.loads(request.body)
        change = data.get('change')  # Expecting '+' or '-'
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate the change parameter
    if change not in ['+', '-']:
        return Response({'error': 'Invalid change parameter. Use "+" or "-".'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        house = get_object_or_404(House, house_id=request.user.owner.house_id)
        device = get_object_or_404(Device, room__house=house, general_product_code="AV0001")
        thermostat = get_object_or_404(VariableOptionDevice, device=device)

        # Adjust the thermostat state
        if change == "-":
            thermostat.state -= 1
        else:
            thermostat.state += 1

        # Ensure the state stays within valid bounds (e.g., 10°C to 30°C)
        if thermostat.state < 16:  # Minimum temperature
            thermostat.state = 16
        elif thermostat.state > 32:  # Maximum temperature
            thermostat.state = 32

        # Save the updated state
        thermostat.save()
        print(str(thermostat.state))

        # Return a success response
        print("Thermostat changed")
        return Response({
            'success': True,
            'new_state': thermostat.state
        }, status=status.HTTP_200_OK)

    except Device.DoesNotExist:
        return Response({'error': 'Thermostat device not found'}, status=status.HTTP_404_NOT_FOUND)
    except VariableOptionDevice.DoesNotExist:
        return Response({'error': 'Thermostat settings not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def guestroomsanddevices(request):
    try:
        # Check if the user is a guest
        guest = request.user.guest
        
        # Get the house associated with the guest
        house = House.objects.get(house_id=guest.house_id)
        
        # Get only the rooms the guest is allowed access to
        allowed_rooms = guest.allowed_rooms.all()
        
        room_counts = {}
        device_counts = {}
        device_options = {}
        updated_device_states = {}

        for room in allowed_rooms:
            for device in room.devices.all():
                # Determine device state based on its type
                if device.get_device_type() == 'Fixed':
                    fixed_device = device.fixed_device.first()
                    if fixed_device:
                        device_options[device.device_id] = fixed_device.options.split(", ")
                        updated_device_states[device.device_id] = fixed_device.state

                elif device.get_device_type() == 'MonitorFixed':
                    monitorfixed_device = device.monitorfixed_device.first()
                    if monitorfixed_device:
                        device_options[device.device_id] = monitorfixed_device.options.split(", ")
                        updated_device_states[device.device_id] = monitorfixed_device.state
                        
                elif device.get_device_type() == 'MonitorVariable':
                    monitorvariable_device = device.monitorvariable_device.first()
                    if monitorvariable_device:
                        device_options[device.device_id] = ['State (0-100)']
                        updated_device_states[device.device_id] = monitorvariable_device.state

                elif device.get_device_type() == 'Variable':
                    variable_device = device.variable_device.first()
                    if variable_device:
                        device_options[device.device_id] = ['State (0-100)']
                        updated_device_states[device.device_id] = variable_device.state

                # Track room and device counts for numbering
                room_counts[room.name] = room_counts.get(room.name, 0) + 1
                device_counts[device.general_product_code] = device_counts.get(device.general_product_code, 0) + 1

        # Get the latest device states (SimPy updates)
        updated_device_states.update({
            device.device_id: device.state
            for device in MonitorFixedDevice.objects.filter(device__room__in=allowed_rooms)
        })
        updated_device_states.update({
            device.device_id: device.state
            for device in MonitorVariableDevice.objects.filter(device__room__in=allowed_rooms)
        })

        # Format response with state and options
        room_data = []
        for room in allowed_rooms:
            devices = [
                {
                    "device_id": device.device_id,
                    "name": device.name,
                    "general_product_code": device.general_product_code,
                    "status": device.status,
                    "device_type": device.get_device_type(),
                    "state": updated_device_states.get(device.device_id, device.get_state()),
                    "options": device_options.get(device.device_id, [])
                }
                for device in room.devices.all()
            ]
            room_data.append({
                "room_id": room.room_id,
                "name": room.name,
                "devices": devices
            })

        return JsonResponse({"rooms": room_data})
    
    except AttributeError:
        # If the user is not a guest (doesn't have guest attribute)
        return JsonResponse({"error": "Access denied. User is not a guest."}, status=403)
    
    except House.DoesNotExist:
        # If no house is found with the guest's house_id
        return JsonResponse({"error": "House not found."}, status=404)
    
    except Exception as e:
        # Handle any other exceptions
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)