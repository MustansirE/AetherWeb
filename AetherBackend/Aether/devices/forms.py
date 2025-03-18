from django import forms
from .models import Room, Device

class AddRoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Room Name'}),
        }

class AddDeviceForm(forms.ModelForm):
    class Meta:
        model = Device
        fields = ['general_product_code']
        widgets = {
            'general_product_code': forms.TextInput(attrs={'placeholder': 'General Product Code'})
        }

class RemoveRoomForm(forms.Form):
    room_id = forms.CharField(widget=forms.HiddenInput())

class RemoveDeviceForm(forms.Form):
    device_id = forms.CharField(widget=forms.HiddenInput())

class ToggleDeviceForm(forms.Form):
    device_id = forms.CharField(widget=forms.HiddenInput())
