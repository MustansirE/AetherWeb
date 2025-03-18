import random
from devices.models import MonitorFixedDevice, MonitorVariableDevice

def run_simulation():
    fixed_devices = MonitorFixedDevice.objects.all()
    for device in fixed_devices:
        if device.options:
            device.state = random.choice(device.options.split(", "))
            device.save()

    variable_devices = MonitorVariableDevice.objects.all()
    for device in variable_devices:
        device.state = random.randint(0, 100)
        device.save()
