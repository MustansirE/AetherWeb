from django import forms
from .models import Owner, User
import random, string

class OwnerSignupForm(forms.Form):
    first_name = forms.CharField(max_length=100)
    last_name = forms.CharField(max_length=100)
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput())
    confirm_password = forms.CharField(widget=forms.PasswordInput())
    plan_type = forms.ChoiceField(choices=[('home', 'Home'), ('business', 'Business')])

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email is already in use!')
        return email

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password:
            if password != confirm_password:
                raise forms.ValidationError("Your passwords do not match!")
        return cleaned_data

class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput())

class GuestLoginForm(forms.Form):
    house_id = forms.IntegerField()
    code = forms.CharField(max_length=10)  
    first_name = forms.CharField(max_length=100)  
    last_name = forms.CharField(max_length=100) 
    
