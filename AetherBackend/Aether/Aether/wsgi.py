import os
import threading
from django.core.wsgi import get_wsgi_application


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Aether.settings')
application = get_wsgi_application()

def start_simulation():
    from simulation.sim import run_simulation 
    print("Starting SimPy simulation from wsgi.py...")
    run_simulation()

simulation_thread = threading.Thread(target=start_simulation, daemon=True)
simulation_thread.start()
