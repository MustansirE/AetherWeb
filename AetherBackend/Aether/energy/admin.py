from django.contrib import admin
from .models import EnergyGoal, UserEnergyUsage, DeviceEnergyUsage, IntervalReading, CommunityEvent

admin.site.register(EnergyGoal)
admin.site.register(UserEnergyUsage)
admin.site.register(DeviceEnergyUsage)
admin.site.register(IntervalReading)
admin.site.register(CommunityEvent)

