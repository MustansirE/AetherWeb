"""
URL configuration for Aether project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from users import user_views
from devices import device_views
from energy import energy_views
from ambiance import ambiance_views
from routines import routine_views
from devicesharing import ds_views
from notifs import notifs_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('admin/', admin.site.urls),
    path('', user_views.start, name='start'),
    path('signup/', user_views.signup, name='signup'),
    path('tutorial/', user_views.tutorial, name='tutorial'),
    path('guest_tutorial/', user_views.guest_tutorial, name='guest_tutorial'),
    path('login/', user_views.ownerlogin, name='ownerlogin'),
    path('guest_login/', user_views.guest_login, name='guest_login'),
    path('home/', user_views.home, name='home'),
    path('me/', user_views.me, name='me'),
    path('my_guests/', user_views.my_guests, name='my_guests'),
    path('get_rooms/', user_views.get_rooms, name='get_rooms'),
    path('create_incomplete_guest/', user_views.create_incomplete_guest, name='create_incomplete_guest'),
    path('check_guest_verification/', user_views.check_guest_verification, name='check_guest_verification'),
    path('delete_unverified_guest/', user_views.delete_unverified_guest, name='delete_unverified_guest'),
    path('add_guest/', user_views.add_guest, name='add_guest'),
    # path('delete_guest/<str:guest_id>/', user_views.delete_guest, name='delete_guest'),
    path("generate_unique_code/", user_views.generate_unique_code, name="generate_unique_code"),
    path('guest_home/',user_views.guest_home, name='guest_home'),
    path('settings/',user_views.settings, name='settings'),
    path('logout/', user_views.logout_view, name='logout'),
    path('guest_logout_view/', user_views.guest_logout_view, name='guest_logout_view'),
    path("password_reset_view/", user_views.password_reset_view, name="password_reset_view"),
    path("account/", user_views.account, name="account"), 
    path("delete_account/", user_views.delete_account, name="delete_account"),
    path("contact_support/", user_views.contact_support, name="contact_support"),
    path("get_energy_goal_and_usage/", user_views.get_energy_goal_and_usage, name="get_energy_goal_and_usage"),
    path("update_energy_goal/", user_views.update_energy_goal, name="update_energy_goal"),
    
    path('roomsanddevices/', device_views.roomsanddevices, name='roomsanddevices'),
    path('guestroomsanddevices/', device_views.guestroomsanddevices, name='guestroomsanddevices'),
    path('add_room/', device_views.add_room, name='add_room'),
    path('remove_room/<str:room_id>/', device_views.remove_room, name='remove_room'),
    path('add_device/<str:room_id>/', device_views.add_device, name='add_device'),
    path('add_device/', device_views.add_device, name='add_device'),
    path('remove_device/<str:room_id>/<int:device_id>/', device_views.remove_device, name='remove_device'),
    path('toggle_device/<int:device_id>/', device_views.toggle_device, name='toggle_device'),
    path('toggle_device/<str:device_id>/', device_views.toggle_device, name='toggle_device'),
    path('update_device_state/<str:device_id>/', device_views.update_device_state, name='update_device_state'),
    path('device_info/<str:device_id>/', device_views.device_info, name='device_info'),
    path('adjust_thermostat/', device_views.adjust_thermostat, name='adjust_thermostat'),
    
    path('energy_home/', energy_views.energy_home, name='energy_home'),
    path('set_goal/', energy_views.set_goal, name='set_goal'),
    path('remove_goal/', energy_views.remove_goal, name='remove_goal'),
    path('usage_stats/', energy_views.usage_stats, name='usage_stats'),
    path('toggle_event_join/<int:event_id>/', energy_views.toggle_event_join, name='toggle_event_join'),
    path('event_list/', energy_views.event_list, name='event_list'),
    path('energy_usage_by_period/<str:period>/', energy_views.energy_usage_by_period, name='energy_usage_by_period'),
    path('energy_distribution/', energy_views.energy_distribution, name='energy_distribution'),
    path('projected_bills/', energy_views.projected_bills, name='projected_bills'),
    
    path('modes_list/', ambiance_views.modes_list, name='modes_list'),
    path('room_devices/<str:room_id>/', ambiance_views.room_devices, name='room_devices'),
    path('toggle_ambiance/<int:mode_id>/', ambiance_views.toggle_ambiance, name='toggle_ambiance'),
    path('add_ambiance_mode/', ambiance_views.add_ambiance_mode, name='add_ambiance_mode'),
    path('update_ambiance_mode/<int:mode_id>/', ambiance_views.update_ambiance_mode, name='update_ambiance_mode'),
    path('mode_details/<int:mode_id>/', ambiance_views.mode_details, name='mode_details'),
    path('delete_ambiance_mode/<int:mode_id>/', ambiance_views.delete_ambiance_mode, name='delete_ambiance_mode'),
    
    path('rooms_list/', routine_views.rooms_list, name='rooms_list'),
    path('room_alldevices/<str:room_id>/', routine_views.room_alldevices, name='room_alldevices'),
    path('automations_list/', routine_views.automations_list, name='automations_list'),
    path('add_automation/', routine_views.add_automation, name='add_automation'),
    path('update_automation/<int:automation_id>/', routine_views.update_automation, name='update_automation'),
    path('delete_automation/<int:automation_id>/', routine_views.delete_automation, name='delete_automation'),
    path('toggle_automation/<int:automation_id>/', routine_views.toggle_automation, name='toggle_automation'),

    path('ds_main/', ds_views.ds_main, name='ds_main'),    
    path('user_devices/', ds_views.user_devices, name='user_devices'),
    path('my_listings/', ds_views.my_listings, name='my_listings'),
    path('lend_requests/', ds_views.lend_requests, name='lend_requests'),
    path('add_listing/', ds_views.add_listing, name='add_listing'),
    path('remove_listing/<int:listing_id>/', ds_views.remove_listing, name='remove_listing'),
    path('request_action/<int:request_id>/', ds_views.request_action, name='request_action'),
    path('return_device/<int:request_id>/', ds_views.return_device, name='return_device'),
    path('search/', ds_views.search_results, name='search_results'),
    path('create_request/<int:listing_id>/', ds_views.create_request, name='create_request'),
    
    path('get_notifications/', notifs_views.get_notifications, name='get_notifications'),
]
