from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta

app = Flask(__name__)

# เชื่อมต่อกับ MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['booking_app']
bookings = db['bookings']

# ตรวจสอบการเชื่อมต่อ MongoDB
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/book', methods=['POST'])
def book():
    name = request.form['name']
    date = request.form['date']
    time = request.form['time']
    
    # ตรวจสอบการจองซ้ำ
    existing_booking = bookings.find_one({'date': date, 'time': time})
    if existing_booking:
        return jsonify({'success': False, 'message': 'เวลานี้ถูกจองแล้ว'})
    
    booking = {
        'name': name,
        'date': date,
        'time': time,
        'created_at': datetime.now()
    }
    
    result = bookings.insert_one(booking)
    return jsonify({'success': True, 'id': str(result.inserted_id)})

@app.route('/bookings', methods=['GET'])
def get_bookings():
    month = int(request.args.get('month'))
    year = int(request.args.get('year'))
    
    start_date = datetime(year=year, month=month, day=1)
    end_date = (start_date + timedelta(days=31)).replace(day=1) - timedelta(days=1)
    
    query = {'date': {'$gte': start_date.strftime('%Y-%m-%d'), '$lte': end_date.strftime('%Y-%m-%d')}}
    
    all_bookings = list(bookings.find(query).sort('date', 1))
    for booking in all_bookings:
        booking['_id'] = str(booking['_id'])
        booking['date'] = booking['date']
        
        # Safely handle 'created_at' field
        if 'created_at' in booking:
            booking['created_at'] = booking['created_at'].isoformat()
        else:
            booking['created_at'] = None  # or you can assign a default value
    
    print("Sending bookings:", all_bookings)
    return jsonify(all_bookings)


@app.route('/booking/<id>', methods=['PUT'])
def update_booking(id):
    data = request.json
    
    # ตรวจสอบการจองซ้ำ
    if 'time' in data:
        existing_booking = bookings.find_one({'date': data['date'], 'time': data['time'], '_id': {'$ne': ObjectId(id)}})
        if existing_booking:
            return jsonify({'success': False, 'message': 'เวลานี้ถูกจองแล้ว'})
    
    result = bookings.update_one({'_id': ObjectId(id)}, {'$set': data})
    return jsonify({'success': result.modified_count > 0})

@app.route('/booking/<id>', methods=['DELETE'])
def delete_booking(id):
    result = bookings.delete_one({'_id': ObjectId(id)})
    return jsonify({'success': result.deleted_count > 0})
@app.route('/available_times', methods=['GET'])
def get_available_times():
    date = request.args.get('date')
    booked_times = [booking['time'] for booking in bookings.find({'date': date})]
    
    # สร้างช่วงเวลาทุก 30 นาที ตั้งแต่ 9:00 ถึง 17:30
    all_times = []
    start_time = datetime.strptime("09:00", "%H:%M")
    end_time = datetime.strptime("17:30", "%H:%M")
    current_time = start_time
    while (current_time <= end_time):
        time_str = current_time.strftime("%H:%M")
        if time_str != "17:30":  # ไม่รวมเวลา 17:30
            all_times.append(time_str)
        current_time += timedelta(minutes=30)
    
    available_times = [time for time in all_times if time not in booked_times]
    
    return jsonify(available_times)

if __name__ == '__main__':
    app.run(debug=True)()