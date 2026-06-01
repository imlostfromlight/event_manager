@echo off
echo === Backend Setup ===
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
echo === Done! Run: python manage.py runserver ===
