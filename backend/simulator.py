import requests
import random
import time

API_URL = "http://localhost:5000/api/sim-data"

while True:
    temp = random.randint(25, 40)
    data = { "temperature": temp }

    try:
        res = requests.post(API_URL, json=data)
        print("Sent:", data, "Status:", res.status_code)
    except:
        print("Send failed")

    time.sleep(2)
