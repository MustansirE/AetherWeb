import json
from django.shortcuts import render, redirect
from devices.models import Device
from devicesharing.models import Listing, Request
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Replace login_required with token-based authentication
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ds_main(request):
    owner = request.user.owner
    my_listings = Listing.objects.filter(owner=owner)
    pending_requests = Request.objects.filter(listing__owner=owner, status='pending')
    active_requests = Request.objects.filter(listing__owner=owner, status='active')
    return render(request, 'ds_main.html', {'my_listings':my_listings, 'pending_requests':pending_requests, 'active_requests':active_requests})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_devices(request):
    owner = request.user.owner
    devices = Device.objects.filter(room__house__owner=owner, general_product_code__startswith='S')
    devices_data = [{
        'id': device.device_id,
        'name': device.name,
        'productCode': device.general_product_code,
        'room': device.room.name,
        'owner': device.room.house.owner.user.email
    } for device in devices]
    return JsonResponse(devices_data, safe=False)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_listings(request):
    owner = request.user.owner
    listings = Listing.objects.filter(owner=owner, has_requested=False)
    listings_data = [{
        'id': listing.id,
        'deviceId': listing.device.device_id,
        'deviceName': listing.device.name,
        'condition': listing.condition
    } for listing in listings]
    return JsonResponse(listings_data, safe=False)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lend_requests(request):
    owner = request.user.owner
    requests = Request.objects.filter(listing__owner=owner)
    requests_data = [{
        'id': req.id,
        'listingId': req.listing.id,
        'deviceName': req.listing.device.name,
        'requesterName': req.user.user.email,
        'status': req.status
    } for req in requests]
    return JsonResponse(requests_data, safe=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_listing(request):
    data = json.loads(request.body)
    owner = request.user.owner
    device_id = data.get('deviceId')
    condition = data.get('condition')
    device = get_object_or_404(Device, device_id=device_id)
    listing = Listing.objects.create(owner=owner, device=device, condition=condition)
    return JsonResponse({
        'id': listing.id,
        'deviceId': listing.device.device_id,
        'deviceName': listing.device.name,
        'condition': listing.condition,
        'isAvailable': True
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_listing(request, listing_id):
    owner = request.user.owner
    listing = get_object_or_404(Listing, id=listing_id, owner=owner)
    listing.delete()
    return JsonResponse({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def approve_request(request, req_id):
    req = Request.objects.filter(id=req_id).first()
    if req:
        req.status = 'active'  
        req.save()
        listing = req.listing
        listing.has_requested = True  
        listing.save()  
    return JsonResponse({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def decline_request(request, req_id):
    req = Request.objects.filter(id=req_id)
    req.delete()
    return JsonResponse({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_results(request):
    query = request.GET.get('query', '').strip()
    print(f"Search query: {query}")  # Debugging: Log the search query

    # Filter listings based on the query
    listings = Listing.objects.filter(device__general_product_code__icontains=query)
    listings = listings.exclude(owner=request.user.owner)
    listings = listings.exclude(request__user=request.user.owner, request__status='active')

    print(f"Number of listings found: {listings.count()}")  # Debugging: Log the number of listings found

    # For API response
    if request.headers.get('Content-Type') == 'application/json':
        listings_data = [{
            'id': listing.id,
            'deviceId': listing.device.device_id,
            'deviceName': listing.device.name,
            'condition': listing.condition,
            'ownerName': listing.owner.user.email,
        } for listing in listings]
        return JsonResponse(listings_data, safe=False)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_action(request, request_id):
    data = json.loads(request.body)
    action = data.get('action')
    req = get_object_or_404(Request, id=request_id)
    
    if action == 'accept':
        req.status = 'active'
        listing = req.listing
        listing.has_requested = True
        listing.save()
        req.save()
    elif action == 'reject':
        listing = req.listing
        listing.has_requested = False
        listing.save()
        req.delete()
    
    return JsonResponse({'status': 'success'})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_device(request, request_id):
    req = get_object_or_404(Request, id=request_id)
    req.status = 'completed'
    req.save()
    
    # Update the listing availability
    listing = req.listing
    listing.has_requested = False
    listing.save()
    
    return JsonResponse({'status': 'success'})
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_request(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id)
    existing_request = Request.objects.filter(listing=listing, user=request.user.owner)
    
    if existing_request.exists():
        return JsonResponse({'status': 'error', 'message': 'Request already exists'}, status=400)
    
    Request.objects.create(listing=listing, user=request.user.owner, status='pending')
    return JsonResponse({'status': 'success'})