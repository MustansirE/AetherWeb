# energy/views.py
import calendar
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import EnergyGoal, UserEnergyUsage, DeviceEnergyUsage, IntervalReading, CommunityEvent
from devices.models import House
from devices.device_views import calculate_usage
from .forms import EnergyGoalForm
from django.utils.timezone import now
from django.db.models import F
from django.db.models import Sum
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal, ROUND_DOWN
from datetime import timedelta
from django.http import JsonResponse
from .models import UserEnergyUsage
from django.utils import timezone
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
import logging

@login_required
def energy_home(request):
    goal = EnergyGoal.objects.filter(homeowner=request.user.owner).first()

    daily_usage = UserEnergyUsage.objects.filter(homeowner=request.user.owner, creation_timestamp__date=now().date()).aggregate(total=Sum('total_consumption'))
    daily_progress = daily_usage['total'] if daily_usage['total'] else 0

    events = CommunityEvent.objects.all()
    
    start_of_month = now().replace(day=1)
    total_usage_month_so_far = UserEnergyUsage.objects.filter(homeowner=request.user.owner, creation_timestamp__gte=start_of_month).aggregate(total=Sum('total_consumption'))['total'] or 0

    start_of_year = now().replace(month=1, day=1)
    total_usage_year_so_far = UserEnergyUsage.objects.filter(homeowner=request.user.owner, creation_timestamp__gte=start_of_year).aggregate(total=Sum('total_consumption'))['total'] or 0

    days_in_month = (start_of_month.replace(month=now().month % 12 + 1) - start_of_month).days
    days_so_far = (now().date() - start_of_month.date()).days
    months_in_year = 12
    months_so_far = (now().month - 1)

    if days_so_far > 0:
        projected_usage_month = (total_usage_month_so_far / days_so_far) * days_in_month
    else:
        projected_usage_month = 0

    if months_so_far > 0:
        projected_usage_year = (total_usage_year_so_far / months_so_far) * months_in_year
    else:
        projected_usage_year = 0

    cost_per_kwh = 0.20
    cost_per_kwh = Decimal(cost_per_kwh)

    projected_cost_month = projected_usage_month * cost_per_kwh
    projected_cost_year = projected_usage_year * cost_per_kwh

    projected_cost_month = projected_cost_month.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    projected_cost_year = projected_cost_year.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    projected_usage_month = projected_usage_month.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    projected_usage_year = projected_usage_year.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

    return render(request, 'energy_home.html',{'goal': goal, 'daily_progress': daily_progress, 'events': events, 'projected_usage_month': projected_usage_month, 'projected_usage_year': projected_usage_year, 'projected_cost_month': projected_cost_month, 'projected_cost_year': projected_cost_year})


@login_required
def set_goal(request):
    if request.method == 'POST':
        form = EnergyGoalForm(request.POST)
        if form.is_valid():
            goal, created = EnergyGoal.objects.update_or_create(
                homeowner=request.user.owner,
                defaults={'goal': form.cleaned_data['goal']}
            )
            return redirect('energy_home')
    else:
        form = EnergyGoalForm()
    return render(request, 'set_goal.html', {'form': form})

@login_required
def remove_goal(request):
    EnergyGoal.objects.filter(homeowner=request.user.owner).delete()
    return redirect('energy_home')

@login_required
def usage_stats(request):
    user = request.user
    today = now().date()

    # Hourly Usage for Today
    hourly_usage = []
    for hour in range(24):  # Loop through 24 hours
        consumption = UserEnergyUsage.objects.filter(
            homeowner=user.owner, 
            creation_timestamp__hour=hour, 
            creation_timestamp__date=today
        ).aggregate(total=Sum('total_consumption'))['total'] or 0
        hourly_usage.append((hour, consumption))

    # Daily Usage for This Week (from Sunday)
    daily_usage = []
    for i in range(7):  # Loop through the past 7 days of the week
        day = today - timedelta(days=(today.weekday() - i +1) % 7)
        consumption = UserEnergyUsage.objects.filter(
            homeowner=user.owner, 
            creation_timestamp__date=day
        ).aggregate(total=Sum('total_consumption'))['total'] or 0
        daily_usage.append((day.strftime('%A'), consumption))

    # Weekly Usage for This Month (Since the 1st)
    weekly_usage = []
    for week in range(1, 6):  # Loop through the first 5 weeks of the month
        # Calculate week start and end dates
        week_start = today.replace(day=1) + timedelta(weeks=week-1)
        week_end = week_start + timedelta(days=6)
        consumption = UserEnergyUsage.objects.filter(
            homeowner=user.owner, 
            creation_timestamp__gte=week_start, 
            creation_timestamp__lte=week_end
        ).aggregate(total=Sum('total_consumption'))['total'] or 0
        weekly_usage.append((f"Week {week}", consumption))

    # Monthly Usage for This Year
    monthly_usage = []
    for month in range(1, 13):  # Loop through all 12 months
        consumption = UserEnergyUsage.objects.filter(
            homeowner=user.owner, 
            creation_timestamp__month=month, 
            creation_timestamp__year=today.year
        ).aggregate(total=Sum('total_consumption'))['total'] or 0
        monthly_usage.append((month, consumption))

    # Yearly Usage for the Past 5 Years
    yearly_usage = []
    for year in range(today.year - 5, today.year + 1):  # Loop through the past 5 years
        consumption = UserEnergyUsage.objects.filter(
            homeowner=user.owner, 
            creation_timestamp__year=year
        ).aggregate(total=Sum('total_consumption'))['total'] or 0
        yearly_usage.append((year, consumption))

    context = {
        'hourly_usage': hourly_usage,
        'daily_usage': daily_usage,
        'weekly_usage': weekly_usage,
        'monthly_usage': monthly_usage,
        'yearly_usage': yearly_usage,
    }

    return render(request, 'usage_stats.html', context)

@login_required
def join_event(request, event_id):
    event = get_object_or_404(CommunityEvent, id=event_id)
    event.joined = True
    event.save()
    return redirect('energy_home')

@login_required
def leave_event(request, event_id):
    event = get_object_or_404(CommunityEvent, id=event_id)
    event.joined = False
    event.save()
    return redirect('energy_home')

def hourly_calculation():
    houses = House.objects.all()
    
    for house in houses:
        devices = house.devices.all()
        for device in devices:
            if device.status == 'off':  
                continue  # Skip if device is off

            # Close old interval
            interval = IntervalReading.objects.filter(
                device_id=device.device_id,
                end__isnull=True  
            ).first()
            
            if interval:  
                interval.end = now()
                interval.usage = calculate_usage(interval)
                interval.save()

            # Create new interval
            IntervalReading.objects.create(
                device_id=device.device_id, 
                homeowner=house.owner,  
                start=now()
            )

            # Update usage
            DeviceEnergyUsage.objects.filter(device_id=device.device_id, creation_timestamp__hour=now().hour).update(total_consumption=F('total_consumption') + interval.usage)
            UserEnergyUsage.objects.filter(homeowner=house.owner, creation_timestamp__hour=now().hour).update(total_consumption=F('total_consumption') + interval.usage)

            DeviceEnergyUsage.objects.filter(device_id=device.device_id, creation_timestamp__date=now().date()).update(total_consumption=F('total_consumption') + interval.usage)
            UserEnergyUsage.objects.filter(homeowner=house.owner, creation_timestamp__date=now().date()).update(total_consumption=F('total_consumption') + interval.usage)

            DeviceEnergyUsage.objects.filter(device_id=device.device_id, creation_timestamp__month=now().month).update(total_consumption=F('total_consumption') + interval.usage)
            UserEnergyUsage.objects.filter(homeowner=house.owner, creation_timestamp__month=now().month).update(total_consumption=F('total_consumption') + interval.usage)

            DeviceEnergyUsage.objects.filter(device_id=device.device_id, creation_timestamp__year=now().year).update(total_consumption=F('total_consumption') + interval.usage)
            UserEnergyUsage.objects.filter(homeowner=house.owner, creation_timestamp__year=now().year).update(total_consumption=F('total_consumption') + interval.usage)

    return
  
logger = logging.getLogger(__name__)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def energy_usage_by_period(request, period):
    homeowner = request.user.owner
    today = timezone.now().date()
    
    logger.info(f"Fetching energy usage for period: {period}")
    
    try:
        if period == 'hourly':
            # Fetch hourly data for today
            data = []
            for hour in range(24):
                usage = UserEnergyUsage.objects.filter(
                    homeowner=homeowner,
                    creation_timestamp__date=today,
                    period='hourly',
                    creation_timestamp__hour=hour
                ).aggregate(total=Sum('total_consumption'))['total'] or 0
                
                data.append({
                    'time': f'{hour:02d}:00', 
                    'usage': float(usage)
                })
                
        elif period == 'daily':
            # Fetch daily data for the current week
            start_of_week = today - timedelta(days=today.weekday())
            data = []
            
            for day in range(7):
                day_date = start_of_week + timedelta(days=day)
                usage = UserEnergyUsage.objects.filter(
                    homeowner=homeowner,
                    creation_timestamp__date=day_date,
                    period='daily'
                ).aggregate(total=Sum('total_consumption'))['total'] or 0
                
                data.append({
                    'day': day_date.strftime('%A'), 
                    'date': day_date.strftime('%Y-%m-%d'),
                    'usage': float(usage)
                })
                
        elif period == 'monthly':
            # Fetch monthly data for the current year
            data = []
            current_year = today.year
            
            for month in range(1, 13):
                usage = UserEnergyUsage.objects.filter(
                    homeowner=homeowner,
                    creation_timestamp__year=current_year,
                    creation_timestamp__month=month,
                    period='monthly'
                ).aggregate(total=Sum('total_consumption'))['total'] or 0
                
                month_name = timezone.datetime(current_year, month, 1).strftime('%B')
                data.append({
                    'month': month_name,
                    'monthNum': month,
                    'usage': float(usage)
                })
                
        elif period == 'yearly':
            # Fetch yearly data for the past 5 years
            data = []
            current_year = today.year
            
            for year in range(current_year - 4, current_year + 1):  # Last 5 years including current
                usage = UserEnergyUsage.objects.filter(
                    homeowner=homeowner,
                    creation_timestamp__year=year,
                    period='yearly'
                ).aggregate(total=Sum('total_consumption'))['total'] or 0
                
                data.append({
                    'year': year,
                    'usage': float(usage)
                })
                
        else:
            logger.error(f"Invalid period: {period}")
            return JsonResponse({'error': 'Invalid period'}, status=400)
        
        logger.info(f"Successfully fetched data for period: {period}, records: {len(data)}")
        print(data)
        return JsonResponse(data, safe=False)
        
    except Exception as e:
        logger.error(f"Error fetching energy usage: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def energy_distribution(request):
    homeowner = request.user.owner
    today = timezone.now().date()
    
    try:
        # Fetch room usage (from last 30 days for more meaningful data)
        thirty_days_ago = today - timedelta(days=30)
        
        room_usage = DeviceEnergyUsage.objects.filter(
            device__room__house__owner=homeowner,
            creation_timestamp__gte=thirty_days_ago,
            period='daily'
        ).values('device__room__name').annotate(
            total=Sum('total_consumption')
        ).order_by('-total')
        
        # Prevent null room names
        room_data = []
        for room in room_usage:
            if room['device__room__name']:
                room_data.append({
                    'name': room['device__room__name'],
                    'usage': float(room['total'])
                })
        
        # Fetch device usage (from last 30 days)
        device_usage = DeviceEnergyUsage.objects.filter(
            device__room__house__owner=homeowner,
            creation_timestamp__gte=thirty_days_ago,
            period='daily'
        ).values('device__name', 'device__device_id').annotate(
            total=Sum('total_consumption')
        ).order_by('-total')
        
        # Prevent null device names
        device_data = []
        for device in device_usage:
            if device['device__name']:
                device_data.append({
                    'name': device['device__name'],
                    'id': device['device__device_id'],
                    'usage': float(device['total'])
                })
        
        # Calculate percentages for visualization
        total_usage = sum(item['usage'] for item in room_data)
        
        if total_usage > 0:
            for item in room_data:
                item['percentage'] = round((item['usage'] / total_usage) * 100, 1)
                
            for item in device_data:
                item['percentage'] = round((item['usage'] / total_usage) * 100, 1)
        print({
            'rooms': room_data,
            'devices': device_data,
            'totalUsage': float(total_usage)
        })
        return JsonResponse({
            'rooms': room_data,
            'devices': device_data,
            'totalUsage': float(total_usage)
        })
        
    except Exception as e:
        logger.error(f"Error fetching energy distribution: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def projected_bills(request):
    
    homeowner = request.user.owner
    today = timezone.now().date()
    cost_per_kwh = Decimal('0.20')  # Using the same rate as in energy_home view
    
    try:
        # Get current month's data
        current_month_start = today.replace(day=1)
        days_in_current_month = calendar.monthrange(today.year, today.month)[1]  # Correctly calculate days in the month
        days_passed = today.day
        
        # Current month's usage so far
        current_month_usage = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            creation_timestamp__year=today.year,
            creation_timestamp__month=today.month,
            period='daily'  # Using daily data for accurate month-to-date
        ).aggregate(total=Sum('total_consumption'))['total'] or Decimal('0')
        
        # Project current month based on usage per day so far
        if days_passed > 0:
            projected_month_usage = (current_month_usage / days_passed) * days_in_current_month
        else:
            projected_month_usage = current_month_usage
        
        # Calculate cost
        projected_month_cost = (projected_month_usage * cost_per_kwh).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Get previous month's data for comparison
        last_month = (today.month - 1) if today.month > 1 else 12
        last_month_year = today.year if today.month > 1 else today.year - 1
        
        last_month_usage = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            creation_timestamp__year=last_month_year,
            creation_timestamp__month=last_month,
            period='monthly'
        ).aggregate(total=Sum('total_consumption'))['total'] or Decimal('0')
        
        # Calculate month-over-month change
        month_change = (projected_month_usage - last_month_usage).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        month_change_pct = ((month_change / last_month_usage * 100) if last_month_usage > 0 else Decimal('0')).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
        
        # Annual projections
        # Get usage for the current year so far
        current_year_usage = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            creation_timestamp__year=today.year,
            period='monthly'  # Using monthly aggregates for year-to-date
        ).aggregate(total=Sum('total_consumption'))['total'] or Decimal('0')
        
        # Project annual usage based on months elapsed
        months_passed = today.month
        if months_passed > 0:
            projected_annual_usage = (current_year_usage / months_passed) * 12
        else:
            projected_annual_usage = current_year_usage
            
        # Calculate annual cost
        projected_annual_cost = (projected_annual_usage * cost_per_kwh).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Get last year's usage for comparison
        last_year_usage = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            creation_timestamp__year=today.year - 1,
            period='yearly'
        ).aggregate(total=Sum('total_consumption'))['total'] or Decimal('0')
        
        # Calculate year-over-year change
        annual_change = (projected_annual_usage - last_year_usage).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        annual_change_pct = ((annual_change / last_year_usage * 100) if last_year_usage > 0 else Decimal('0')).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
        
        # Average daily usage (last 7 days for better accuracy)
        week_ago = today - timedelta(days=7)
        daily_usage = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            creation_timestamp__date__gte=week_ago,
            creation_timestamp__date__lte=today,
            period='daily'
        ).aggregate(total=Sum('total_consumption'))['total'] or Decimal('0')
        
        avg_daily = (daily_usage / 7 if daily_usage > 0 else Decimal('0')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Peak day identification (look at the entire year, not just the current month)
        peak_day_data = UserEnergyUsage.objects.filter(
            homeowner=homeowner,
            period='daily',
            creation_timestamp__year=today.year
        ).order_by('-total_consumption').first()
        
        peak_day_usage = peak_day_data.total_consumption if peak_day_data else Decimal('0')
        peak_day_date = peak_day_data.creation_timestamp.strftime('%Y-%m-%d') if peak_day_data else None
        
        response_data = {
            'currentMonth': {
                'usage': float(current_month_usage),
                'projected': float(projected_month_usage),
                'cost': float(projected_month_cost),
                'change': float(month_change),
                'changePercent': float(month_change_pct)
            },
            'annual': {
                'usage': float(current_year_usage),
                'projected': float(projected_annual_usage),
                'cost': float(projected_annual_cost),
                'change': float(annual_change),
                'changePercent': float(annual_change_pct)
            },
            'daily': {
                'average': float(avg_daily),
                'peak': float(peak_day_usage),
                'peakDate': peak_day_date
            },
            'costRate': float(cost_per_kwh)
        }
        print(response_data)
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error calculating projected bills: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    

# Add these imports at the top if not already present
from rest_framework.response import Response
from rest_framework import status

# energy/views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_event_join(request, event_id):
    try:
        event = CommunityEvent.objects.get(id=event_id)
        user = request.user.owner
        
        # Toggle participation
        if event.participants.filter(id=user.id).exists():
            event.participants.remove(user)
            joined = False
        else:
            event.participants.add(user)
            joined = True
            
        return Response({
            'status': 'success',
            'event_id': event.id,
            'joined': joined,
            'participants_count': event.participants.count()
        })
        
    except CommunityEvent.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
from django.db.models import Exists, OuterRef

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_list(request):
    events = CommunityEvent.objects.annotate(
        joined=Exists(request.user.owner.joined_events.filter(id=OuterRef('id')))
    ).values(
        'id', 'name', 'description', 'date', 'time', 'joined'
    )
    return Response(list(events))