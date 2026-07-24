"""
Optional helper: creates two demo accounts so you can test a full payment
without registering manually. Run from the backend/ folder with the venv
active: python database/seed.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app, db
from app.models import User, Wallet, Device

DEMO_USERS = [
    {"name": "Rohan Verma", "email": "rohan@example.com", "password": "password123", "device": "Rohan's Galaxy S23", "mac": "A4:C1:38:2E:9F:0B"},
    {"name": "Priya Nair", "email": "priya@example.com", "password": "password123", "device": "Priya's Pixel 8", "mac": "F0:9E:4B:71:C3:2A"},
]

app = create_app()
with app.app_context():
    for u in DEMO_USERS:
        if User.query.filter_by(email=u["email"]).first():
            print(f"Skipping {u['email']} — already exists.")
            continue
        user = User(name=u["name"], email=u["email"])
        user.set_password(u["password"])
        db.session.add(user)
        db.session.flush()
        db.session.add(Wallet(user_id=user.id, balance=5000.00))
        db.session.add(Device(user_id=user.id, device_name=u["device"], mac_address=u["mac"]))
        print(f"Created {u['email']} / {u['password']}")
    db.session.commit()

print("\nDone. Log in as either demo user in the frontend (use two different browsers or an incognito window for the second one).")
