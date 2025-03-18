from django import forms


class ToggleModeForm(forms.Form):
    mode_id = forms.CharField(widget=forms.HiddenInput())