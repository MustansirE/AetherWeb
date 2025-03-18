from django.contrib import admin
from .models import Automation, AutomationDevice

admin.site.register(Automation)
admin.site.register(AutomationDevice)