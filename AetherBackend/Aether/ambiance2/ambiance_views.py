from django.shortcuts import get_object_or_404, render, redirect
from .models import AmbianceMode
from devices.models import House, Room, Device

def ambiance_home(request):
    return render(request, 'ambiance_home.html')

def add_ambiance(request):
    house = get_object_or_404(House, house_id=request.user.owner.house_id)
    rooms = Room.objects.filter(house=house, devices__general_product_code__in=['AF0005', 'AF0003', 'LF0002', 'AV0001']).distinct()
    selected_devices = []

    if request.method == "POST":
        if "add_device" in request.POST:
            device_id = request.POST.get("device")
            state = request.POST.get("state")
            if device_id and state:
                device = Device.objects.get(device_id=device_id)
                selected_devices.append({"device_id": device.device_id, "name": device.name, "state": state})

        elif "remove_device" in request.POST:
            device_id = request.POST.get("remove_device")
            selected_devices = [d for d in selected_devices if d["device_id"] != device_id]

        elif "save_mode" in request.POST:
            mode_name = request.POST.get("mode_name")
            room = Room.objects.get(room_id=request.POST.get("room"))
            if mode_name and room and selected_devices:
                mode = AmbianceMode.objects.create(name=mode_name, room=room)
                for d in selected_devices:
                    device = Device.objects.get(device_id=d["device_id"])
                    mode.devices.add(device)
                return redirect("home")
            
    print(rooms)
    print(selected_devices)

    return render(request, "add_ambiance.html", {"rooms": rooms, "selected_devices": selected_devices})


from django.http import JsonResponse

def get_devices(request):
    room_id = request.GET.get("room_id")
    if room_id:
        room = Room.objects.get(room_id=room_id)
        devices = room.devices.all()
        device_data = []
        state_data = []

        for device in devices:            
            if device.general_product_code == 'AF0003':
                state_data = ["clean", "sandalwood", "rose", "ocean", "cookie", "eucalyptus", "lemongrass"]
                device_data.append({
                    "device_id": device.device_id,
                    "name": device.name,
                })
            elif device.general_product_code == 'AF0005':
                state_data = ["red", "gold", "white", "green", "blue", "violet"]
                device_data.append({
                    "device_id": device.device_id,
                    "name": device.name,
                })
            elif device.general_product_code == 'LF0002':
                state_data = ["idle", "bluetooth", "pop", "jazz", "classical", "nature sounds", "white noise"]
                device_data.append({
                    "device_id": device.device_id,
                    "name": device.name,
                })
            elif device.general_product_code == 'AV0001':
                state_data = ["25"]
                device_data.append({
                    "device_id": device.device_id,
                    "name": device.name,
                })

        print(device_data)
        print(state_data)
        return JsonResponse({
            'devices': device_data,
            'states': state_data
        })

    return JsonResponse({'error': 'Room ID is required'}, status=400)


def get_device_states(request):
    device_id = request.GET.get("device_id")
    if device_id:
        device = Device.objects.get(device_id=device_id)
        state_data = []

        if device.general_product_code == 'AF0003':
            state_data = ["clean", "sandalwood", "rose", "ocean", "cookie", "eucalyptus", "lemongrass"]
        elif device.general_product_code == 'AF0005':
            state_data = ["red", "gold", "white", "green", "blue", "violet"]
        elif device.general_product_code == 'LF0002':
            state_data = ["idle", "bluetooth", "pop", "jazz", "classical", "nature sounds", "white noise"]
        elif device.general_product_code == 'AV0001':
            state_data = ["25"]

        return JsonResponse({
            'states': state_data
        })

    return JsonResponse({'error': 'Device ID is required'}, status=400)
