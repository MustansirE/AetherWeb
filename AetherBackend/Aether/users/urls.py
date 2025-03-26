from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('verify-email/<uuid:token>/', views.verify_email, name='verify_email'),
]

from django.urls import include, path

urlpatterns = [
    path('users/', include('users.urls')),
]