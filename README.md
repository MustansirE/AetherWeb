Steps to run the app:
---------------------
1. Download the code
2. Open 'AetherWeb' dir on VSCode
3. Open two seperate integrated terminal sessions

Run the React server (frontend) by:
...................................
cd AetherFrontend 
npm run dev 

Run the Django server (backend) by:
...................................
cd AetherBackend
source venv/bin/activate
cd Aether 
python manage.py runserver 


Notes:
--------------------
1. You must start both the React and Django servers in order to use the app
2. Check the venv folder exists in AetherBackend. If it doesnt, you need to create it (search it up) and isntall the needed dependencies.
3. To open the admin panel and view the database, you must create a superuser:
   - navigate to 'Aether' dir
   - python manage.py createsuperuser
   - set your preferred credentials (I use username: admin, password: 1234567890)
   - python manage.py runserver 
   - go to http://127.0.0.1:8000/admin/ in your browser and login using those credentials
     
