# Generated by Django 5.1.6 on 2025-03-16 06:19

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('devices', '0009_monitorfixeddevice_monitorvariabledevice_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Automation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('status', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='AutomationDevice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('state', models.CharField(default=' ', max_length=100)),
                ('status', models.BooleanField(default=False)),
                ('prev_status', models.CharField(default=' ', max_length=100)),
                ('prev_state', models.CharField(default=' ', max_length=100)),
                ('automation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='devices', to='automation.automation')),
                ('device', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='controlled_by_automation', to='devices.device')),
            ],
        ),
    ]
