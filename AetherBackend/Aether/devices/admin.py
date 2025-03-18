from django.contrib import admin
from .models import House, Room, Device, FixedOptionDevice, VariableOptionDevice, MonitorFixedDevice, MonitorVariableDevice

admin.site.register(House)
admin.site.register(Room)
admin.site.register(Device)
admin.site.register(FixedOptionDevice)
admin.site.register(VariableOptionDevice)
admin.site.register(MonitorFixedDevice)
admin.site.register(MonitorVariableDevice)

