import json
from pyexpat.errors import messages
import random
from django.utils.crypto import get_random_string
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from energy.models import EnergyGoal, IntervalReading, UserEnergyUsage
from .models import Owner, User, Guest
from devices.models import Device, House, Room, MonitorFixedDevice, MonitorVariableDevice, VariableOptionDevice
from .forms import LoginForm, OwnerSignupForm, GuestLoginForm
from notifs.models import Notification
from virtualenv.models import VirtualEnv  
from django.utils.timezone import now
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum


def start(request):
    return render(request, 'start.html')

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=400)

    required_fields = ['email', 'password', 'confirm_password', 'plan_type']
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'{field} is required'}, status=400)

    if data['password'] != data.get('confirm_password'):
        return Response({'error': 'Passwords do not match'}, status=400)

    plan_type = data.get('plan_type', 'home').lower()
    if plan_type not in ['home', 'business']:
        return Response({'error': 'Invalid plan type'}, status=400)

    phone = data.get('phone', '')
    if not phone.isdigit() or len(phone) != 9:
        return Response({'error': 'Phone must be 9 digits'}, status=400)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=data['email'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', '')
            )
            user.save()

            owner = Owner.objects.create(
                user=user,
                plan_type=plan_type,
                house_id=random.randint(100000, 999999),
            )
            owner.save()
            
            house = House.objects.create (
                owner=owner,
                house_id=owner.house_id
            )
            house.save()
            
            # add an 'All' room
            # in 'All' add thermostat and Monitor devices 
            room = Room.objects.create(name='All', house=house, room_id=get_random_string(8), room_number=1)
            room.save()
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            thermostat = Device(device_id=device_id, name="Thermostat", general_product_code="AV0001", manufacturer="Aether", average_energy_consumption_per_hour=0.03, status='on', room=room, device_number=1)
            thermostat.save()
            VariableOptionDevice.objects.create(device=thermostat, state=22)
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            watermonitor = Device(device_id=device_id, name="Water Monitoring System", general_product_code="MY0001", manufacturer="Aether", average_energy_consumption_per_hour=0.01, status='on', room=room, device_number=1)
            watermonitor.save()
            MonitorFixedDevice.objects.create(device=watermonitor, options=["secure", "detects a leak!"], state="secure")
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            motionsensor = Device(device_id=device_id, name="Motion Sensor", general_product_code="MY0002", manufacturer="Aether", average_energy_consumption_per_hour=0.0025, status='on', room=room, device_number=1)
            motionsensor.save()
            MonitorFixedDevice.objects.create(device=motionsensor, options=["idle", "triggered"], state="idle")
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            pestdetector = Device(device_id=device_id, name="Pest Detector", general_product_code="SY0001", manufacturer="Aether", average_energy_consumption_per_hour=0.001, status='on', room=room, device_number=1)
            pestdetector.save()
            MonitorFixedDevice.objects.create(device=pestdetector, options=["safe", "detects a pest!"], state="safe")
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            waterhardnesstester = Device(device_id=device_id, name="Water Hardness Tester", general_product_code="SZ0002", manufacturer="Aether", average_energy_consumption_per_hour=0.001, status='on', room=room, device_number=1)
            waterhardnesstester.save()
            MonitorVariableDevice.objects.create(device=waterhardnesstester, state=0)
        
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            lightintensity = Device(device_id=device_id, name="Light Intensity Sensor", general_product_code="MZ0005", manufacturer="Aether", average_energy_consumption_per_hour=0.0025, status='on', room=room, device_number=1)
            lightintensity.save()
            MonitorVariableDevice.objects.create(device=lightintensity, state=0)
        
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            humidity = Device(device_id=device_id, name="Humidity Sensor", general_product_code="MZ0004", manufacturer="Aether", average_energy_consumption_per_hour=0.0025, status='on', room=room, device_number=1)
            humidity.save()
            MonitorVariableDevice.objects.create(device=humidity, state=0)
            
            device_id = generate_unique_code()
            while room.devices.filter(device_id=device_id).exists():  
                device_id = generate_unique_code()
            tempsensor = Device(device_id=device_id, name="Temperature Sensor", general_product_code="MZ0003", manufacturer="Aether", average_energy_consumption_per_hour=0.0025, status='on', room=room, device_number=1)
            tempsensor.save()
            MonitorVariableDevice.objects.create(device=tempsensor, state=0)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'user_id': user.id
            }, status=201)

    except IntegrityError:
        return Response({'error': 'Email already exists'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

    
@login_required
def tutorial(request):
    return render(request, 'tutorial.html')

@login_required
def guest_tutorial(request):
    return render(request, 'guest_tutorial.html')

@csrf_exempt
def ownerlogin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            user = authenticate(request, username=email, password=password)

            if user is not None:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                return JsonResponse({'access_token': access_token}, status=200)
            return JsonResponse({'error': 'Invalid credentials'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    return JsonResponse({'error': 'Invalid method'}, status=405)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def guest_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            code = data.get('guestCode')
            house_id = data.get('houseId')
            
            try:
                # Find unverified guest
                guest = Guest.objects.get(code=code, house_id=house_id, verified=False)
                user = guest.user
                
                # Authenticate using code as password
                auth_user = authenticate(request, username=user.username, password=code)
                
                if auth_user is not None:
                    # Generate tokens same as regular login
                    refresh = RefreshToken.for_user(auth_user)
                    access_token = str(refresh.access_token)
                    
                    # Mark as verified
                    guest.verified = True
                    guest.save()
                    
                    return JsonResponse({
                        'access_token': access_token,
                        'redirect': '/guest-dashboard'
                    }, status=200)
                
                return JsonResponse({'error': 'Authentication failed'}, status=400)
            
            except Guest.DoesNotExist:
                return JsonResponse({'error': 'Invalid code or already used'}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid method'}, status=405)


def get_daily_energy_usage(user):
    """Fetches the user's total daily energy usage from both UserEnergyUsage and IntervalReading."""
    
    # Get total from UserEnergyUsage
    daily_usage = UserEnergyUsage.objects.filter(
        homeowner=user.owner,
        creation_timestamp__date=now().date()
    ).aggregate(total=Sum('total_consumption'))['total'] or 0
    
    # Get total from IntervalReading
    interval_usage = IntervalReading.objects.filter(
        homeowner=user.owner,
        start__date=now().date()
    ).aggregate(total=Sum('usage'))['total'] or 0  # Ensure None is treated as 0

    # Return the sum of both
    return daily_usage + interval_usage

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home(request):
    user = request.user

    # Initialize alert notifications
    alert_notifs = []
    for device in MonitorFixedDevice.objects.filter(device__room__house__owner__user=user):
        if device.state in ["'triggered!']", "'detects a leak!']", "'detects a pest!']"]:  
            state = device.state[1:-2]  # Extract state without brackets
            message = f"{device.device.name} {state}!"
            alert_notif = Notification.objects.create(user=user, message=message, type='alert', created_at=now(), is_read=False)
            alert_notifs.append({
                'message': message,
                'type': 'alert',
                'created_at': alert_notif.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'is_read': alert_notif.is_read
            })

    # Fetch sensor data
    current_temp = getattr(
        MonitorVariableDevice.objects.filter(
            device__room__house__owner__user=user, device__name="Temperature Sensor"
        ).first(),
        "state",
        0,
    )

    current_humidity = getattr(
        MonitorVariableDevice.objects.filter(
            device__room__house__owner__user=user, device__name="Humidity Sensor"
        ).first(),
        "state",
        0,
    )

    current_light = getattr(
        MonitorVariableDevice.objects.filter(
            device__room__house__owner__user=user, device__name="Light Intensity Sensor"
        ).first(),
        "state",
        0,
    )

    daily_progress = get_daily_energy_usage(request.user)
    house = get_object_or_404(House, house_id=request.user.owner.house_id)
    device = get_object_or_404(Device, room__house=house, general_product_code="AV0001")
    thermostat = get_object_or_404(VariableOptionDevice, device=device)
    thermostat_state = thermostat.state

    # Virtual environment detection
    # Determine virtual environment
    virtual_env = None
    virtual_env_message = ""

    if current_temp > 30 and current_humidity > 70:
        virtual_env = "Rainforest"
        virtual_env_message = "Your environment matches that of a Rainforest. Save energy and activate the virtual environment."
    elif current_temp < 5:
        virtual_env = "Arctic"
        virtual_env_message = "Your environment is as cold as the Arctic. You may need additional heating."
    elif current_humidity < 30:
        virtual_env = "Desert"
        virtual_env_message = "Your environment is dry like a Desert. Consider adding humidity for comfort."

    daily_usage = UserEnergyUsage.objects.filter(homeowner=request.user.owner, creation_timestamp__date=now().date()).aggregate(total=Sum('total_consumption'))

    print({
        "temperature": current_temp,
        "humidity": current_humidity,
        "light_intensity": current_light,
        "energy_usage":daily_progress ,
        "thermostat_state": thermostat_state,
        "virtual_environment": bool(virtual_env),  # True if an environment is detected
        "virtual_environment_message": virtual_env_message,
    })
    return JsonResponse({
        "temperature": current_temp,
        "humidity": current_humidity,
        "light_intensity": current_light,
        "energy_usage": daily_progress ,
        "thermostat_state": thermostat_state,
        "virtual_environment": bool(virtual_env),  # True if an environment is detected
        "virtual_environment_message": virtual_env_message,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        # Authenticate the user using the token
        # Assuming you have a custom authentication backend or logic to validate the token
        user = request.user
        if not user:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        # Return the user's data
        user_data = {
            'name': user.get_full_name() or user.first_name,  # Return full name or username
            'email': user.email,
        }
        print(user_data)
        return JsonResponse(user_data)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def my_guests(request):
    try:
        guests = Guest.objects.filter(
            owner=request.user.owner,
            verified=True
        ).select_related('user')
        
        # Serialize all guest data
        guest_data = []
        for guest in guests:
            guest_data.append({
                "id": str(guest.id),
                "full_name": {guest.user.first_name},
                "email": guest.user.email,
                "departure_date": guest.departure_date.strftime("%Y-%m-%d"),
                "access_code": guest.code,
                "allowed_rooms": [room.name for room in guest.allowed_rooms.all()]
            })
        print(guest_data)
        return JsonResponse({"guests": guest_data}, safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@login_required
def get_rooms(request):
    owner = request.user.owner
    rooms = Room.objects.filter(house__owner=owner)
    return JsonResponse({'rooms': [{'id': room.id, 'name': room.name} for room in rooms]})

@api_view(['POST'])
@login_required
def create_incomplete_guest(request):
    owner = request.user.owner
    data = json.loads(request.body)
    
    # Generate unique codes
    code = generate_unique_code()
    while Guest.objects.filter(code=code).exists():
        code = generate_unique_code()
    
    u_code = generate_unique_code()
    while User.objects.filter(username=u_code).exists():
        u_code = generate_unique_code()

    # Create guest user
    guest_user = User.objects.create_user(
        username=u_code,
        email="none",
        password=str(code),
        first_name=data.get('name'),
        last_name="User"
    )
    guest_user.save()

    # Create guest
    guest = Guest.objects.create(
        owner=owner,
        user=guest_user,
        code=code,
        house_id=owner.house_id,
        departure_date=data.get('departure_date'),
        verified=False  # Now matches BooleanField
    )
    guest.save()

    # Add allowed rooms
    for room_id in data.get('allowed_rooms', []):
        room = Room.objects.get(id=room_id)
        guest.allowed_rooms.add(room)

    return JsonResponse({
        'guestCode': code,
        'houseId': owner.house_id,
        'guestId': guest.id,
    })


@api_view(['POST'])
@login_required
def check_guest_verification(request):
    guest_id = request.data.get('guest_id')
    try:
        guest = Guest.objects.get(id=guest_id)
        return JsonResponse({'verified': guest.verified})
    except Guest.DoesNotExist:
        return JsonResponse({'error': 'Guest not found'}, status=404)
    
    
@api_view(['POST'])
@login_required
def delete_unverified_guest(request):
    guest_id = request.data.get('guest_id')
    try:
        guest = Guest.objects.get(id=guest_id)
        if guest.verified == 0:
            guest.delete()
            return JsonResponse({'status': 'deleted'})
        return JsonResponse({'status': 'verified'})
    except Guest.DoesNotExist:
        return JsonResponse({'error': 'Guest not found'}, status=404)

@api_view(['GET', 'POST'])
@csrf_exempt
@login_required
def add_guest(request):
    owner = Owner.objects.get(user=request.user)
    house = get_object_or_404(House, house_id=owner.house_id)
    all_rooms = house.rooms.all()

    current_guest_count = Guest.objects.filter(owner=owner).count()
    guest_limit = 10 if owner.plan_type == 'home' else 75
    if current_guest_count >= guest_limit:
        return render(request, 'my_guests.html', {'error': f'You have reached the guest limit of {guest_limit} guests.'})

    if request.method == 'POST':
        selected_room_ids = request.POST.getlist('rooms')
        departure_date = request.POST.get('departure_date')

        if not selected_room_ids:
            return render(request, 'add_guest.html', {'rooms': all_rooms, 'error': 'Please select at least one room.'})

        code = generate_unique_code()
        while Guest.objects.filter(code=code).exists():
            code = generate_unique_code()
        u_code = generate_unique_code()
        while User.objects.filter(username=u_code).exists():
            u_code = generate_unique_code()

        guest_user = User.objects.create_user(
            username=u_code,
            email="none",
            password=str(code),
            first_name="Guest",
            last_name="User"
        )
        guest = Guest.objects.create(
            owner=owner,
            user=guest_user,
            code=code,
            house_id=owner.house_id,
            departure_date=departure_date
        )

        for room_id in selected_room_ids:
            try:
                room = house.rooms.get(room_id=room_id)
                guest.allowed_rooms.add(room)
            except Room.DoesNotExist:
                print(f"Room with ID {room_id} does not exist.")

        guests = Guest.objects.filter(owner=owner).exclude(user__first_name="Guest")
        return render(request, 'my_guests.html', {'success': f'Guest code {code} generated successfully!', 'code': code, 'house': owner.house_id, 'guests': guests})
    
    return render(request, 'add_guest.html', {'rooms': all_rooms})

def generate_unique_code():
    return random.randint(10000000, 99999999)

@login_required
def guest_home(request):
    try:
        guest = Guest.objects.get(user=request.user)
    except Guest.DoesNotExist:
        return render(request, 'guest_home.html', {'error': 'Guest not found.'})

    allowed_rooms = guest.allowed_rooms.prefetch_related('devices')
    return render(request, 'guest_home.html', {'rooms':allowed_rooms})

@login_required
def settings(request):
    return render(request, 'settings.html')

@api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    print("Logout successful!")
    return JsonResponse({"message": "Logged out successfully"})

@login_required
def guest_logout_view(request):
    try:
        guest = Guest.objects.get(user=request.user)
        guest_user = request.user
        guest.delete()
        guest_user.delete()
    except Guest.DoesNotExist:
        pass  
    
    logout(request)
    return redirect('start')

def password_reset_view(request):
    if request.method == "POST":
        email = request.POST.get("email")
        user = User.objects.filter(email=email).first()
        
        if user:
            return render(request, "password_reset.html", {"reset_sent": True})

        else:
            return render(request, "password_reset.html", {"error": "Email not found."})
    
    return render(request, "password_reset.html")

@api_view(['GET', 'POST'])
@csrf_exempt
@login_required
def account(request):
    user = request.user

    if request.method == "GET":
        return JsonResponse({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        })

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user.first_name = data.get("first_name", user.first_name)
            user.last_name = data.get("last_name", user.last_name)
            user.email = data.get("email", user.email)
            user.save()
            return JsonResponse({"message": "Profile updated successfully!"})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)

@api_view(['DELETE'])
@csrf_exempt
@login_required
def delete_account(request):
    user = request.user
    user.delete()
    logout(request)
    return JsonResponse({"message": "Account deleted successfully"}, status=200)

def contact_support(request):
    if request.method == "POST":
        return render(request, "contact_support.html", {"success": "We will get back to you within 24 hours, so keep an eye on your email inbox!"})
    
    return render(request, "contact_support.html")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_energy_goal_and_usage(request):
    try:
        # Fetch the user's energy goal
        energy_goal = EnergyGoal.objects.filter(homeowner=request.user.owner).first()
        goal = energy_goal.goal if energy_goal else 0  # Default to 0 if no goal is set

        # Fetch today's usage
        today = timezone.now().date()
        today_usage = UserEnergyUsage.objects.filter(
            homeowner=request.user.owner,
            creation_timestamp__date=today,
            period='daily'
        ).aggregate(total=Sum('total_consumption'))['total'] or 0

        # Calculate percentage of goal used
        percentage_used = (today_usage / goal * 100) if goal > 0 else 0

        return JsonResponse({
            'goal': float(goal),
            'today_usage': float(today_usage),
            'percentage_used': float(percentage_used),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_energy_goal(request):
    try:
        new_goal = request.data.get('goal')
        if new_goal is None:
            return JsonResponse({'error': 'Goal is required'}, status=400)

        # Update or create the energy goal
        energy_goal, created = EnergyGoal.objects.update_or_create(
            homeowner=request.user.owner,
            defaults={'goal': new_goal}
        )

        return JsonResponse({
            'success': True,
            'goal': float(energy_goal.goal),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)