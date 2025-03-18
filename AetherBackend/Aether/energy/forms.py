from django import forms
from .models import EnergyGoal


class EnergyGoalForm(forms.ModelForm):
    class Meta:
        model = EnergyGoal
        fields = ['goal']
        labels = {
            'goal': 'Energy Goal (kWh)',
        }
        widgets = {
            'goal': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Enter daily energy goal'}),
        }
