from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from sqlalchemy import func
import os
import cv2
import face_recognition
import numpy as np
import pickle
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Database configuration - use persistent storage on Render
if os.environ.get('RENDER'):
    # For Render deployment - use persistent disk
    database_path = os.path.join('/opt/render/project/src', 'attendance.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
else:
    # For local development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'

db = SQLAlchemy(app)

# Models
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    face_encoding = db.Column(db.LargeBinary, nullable=True)  # Store face encoding
    attendance = db.relationship('Attendance', backref='student', lazy=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    attendance = db.relationship('Attendance', backref='course', lazy=True)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    status = db.Column(db.Boolean, default=False)  # True for present, False for absent

# Create tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    total_students = Student.query.count()
    total_courses = Course.query.count()
    
    # Calculate today's attendance percentage
    today = date.today()
    today_attendance = Attendance.query.filter_by(date=today).all()
    if today_attendance:
        present_count = sum(1 for a in today_attendance if a.status)
        attendance_percentage = round((present_count / len(today_attendance)) * 100, 1)
    else:
        attendance_percentage = 0
    
    return render_template('index.html', 
                         total_students=total_students,
                         total_courses=total_courses,
                         attendance_percentage=attendance_percentage)

@app.route('/students')
def students():
    all_students = Student.query.all()
    return render_template('students.html', students=all_students)

@app.route('/add_student', methods=['GET', 'POST'])
def add_student():
    if request.method == 'POST':
        name = request.form['name']
        roll_number = request.form['roll_number']
        email = request.form['email']
        
        new_student = Student(name=name, roll_number=roll_number, email=email)
        db.session.add(new_student)
        db.session.commit()
        
        flash('Student added successfully!', 'success')
        return redirect(url_for('students'))
    
    return render_template('add_student.html')

@app.route('/view_student/<int:student_id>')
def view_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    # Get attendance statistics
    total_classes = Attendance.query.filter_by(student_id=student_id).count()
    present_count = Attendance.query.filter_by(student_id=student_id, status=True).count()
    absent_count = total_classes - present_count
    percentage = (present_count / total_classes * 100) if total_classes > 0 else 0
    
    # Get recent attendance records
    recent_attendance = Attendance.query.filter_by(student_id=student_id).order_by(Attendance.date.desc()).limit(10).all()
    
    return render_template('view_student.html', 
                         student=student,
                         total_classes=total_classes,
                         present_count=present_count,
                         absent_count=absent_count,
                         percentage=round(percentage, 2),
                         recent_attendance=recent_attendance)

@app.route('/edit_student/<int:student_id>', methods=['GET', 'POST'])
def edit_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    if request.method == 'POST':
        student.name = request.form['name']
        student.roll_number = request.form['roll_number']
        student.email = request.form['email']
        
        db.session.commit()
        flash('Student updated successfully!', 'success')
        return redirect(url_for('students'))
    
    return render_template('edit_student.html', student=student)

@app.route('/delete_student/<int:student_id>', methods=['POST'])
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    
    # Delete associated attendance records
    Attendance.query.filter_by(student_id=student_id).delete()
    
    # Delete student
    db.session.delete(student)
    db.session.commit()
    
    flash('Student deleted successfully!', 'success')
    return redirect(url_for('students'))

@app.route('/courses')
def courses():
    all_courses = Course.query.all()
    return render_template('courses.html', courses=all_courses)

@app.route('/add_course', methods=['GET', 'POST'])
def add_course():
    if request.method == 'POST':
        name = request.form['name']
        code = request.form['code']
        
        new_course = Course(name=name, code=code)
        db.session.add(new_course)
        db.session.commit()
        
        flash('Course added successfully!', 'success')
        return redirect(url_for('courses'))
    
    return render_template('add_course.html')

@app.route('/attendance')
def attendance():
    courses = Course.query.all()
    return render_template('attendance.html', courses=courses)

@app.route('/mark_attendance/<int:course_id>', methods=['GET', 'POST'])
def mark_attendance(course_id):
    course = Course.query.get_or_404(course_id)
    students = Student.query.all()
    today = date.today()
    
    if request.method == 'POST':
        # Delete existing attendance for today for this course
        Attendance.query.filter_by(course_id=course_id, date=today).delete()
        
        # Mark new attendance
        for student in students:
            status = request.form.get(f'student_{student.id}') == 'present'
            attendance_record = Attendance(
                student_id=student.id,
                course_id=course_id,
                date=today,
                status=status
            )
            db.session.add(attendance_record)
        
        db.session.commit()
        flash('Attendance marked successfully!', 'success')
        return redirect(url_for('attendance'))
    
    # Get existing attendance for today
    existing_attendance = {}
    attendance_records = Attendance.query.filter_by(course_id=course_id, date=today).all()
    for record in attendance_records:
        existing_attendance[record.student_id] = record.status
    
    return render_template('mark_attendance.html', course=course, students=students, 
                         existing_attendance=existing_attendance, today=today)

@app.route('/reports')
def reports():
    courses = Course.query.all()
    students = Student.query.all()
    return render_template('reports.html', courses=courses, students=students)

@app.route('/generate_report', methods=['POST'])
def generate_report():
    report_type = request.form.get('report_type')
    course_id = request.form.get('course_id')
    student_id = request.form.get('student_id')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    
    # Convert dates
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    report_data = []
    
    if report_type == 'student':
        # Student-wise report
        student = Student.query.get(student_id)
        query = Attendance.query.filter_by(student_id=student_id)
        
        if course_id:
            query = query.filter_by(course_id=course_id)
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        records = query.all()
        total = len(records)
        present = sum(1 for r in records if r.status)
        percentage = (present / total * 100) if total > 0 else 0
        
        report_data = {
            'type': 'student',
            'student': student,
            'total_classes': total,
            'present': present,
            'absent': total - present,
            'percentage': round(percentage, 2),
            'records': records
        }
        
    elif report_type == 'course':
        # Course-wise report
        course = Course.query.get(course_id)
        query = Attendance.query.filter_by(course_id=course_id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        records = query.all()
        
        # Group by date
        date_wise = {}
        for record in records:
            date_str = record.date.strftime('%Y-%m-%d')
            if date_str not in date_wise:
                date_wise[date_str] = {'total': 0, 'present': 0}
            date_wise[date_str]['total'] += 1
            if record.status:
                date_wise[date_str]['present'] += 1
        
        report_data = {
            'type': 'course',
            'course': course,
            'date_wise': date_wise,
            'records': records
        }
    
    elif report_type == 'overall':
        # Overall attendance report
        students = Student.query.all()
        student_stats = []
        
        for student in students:
            query = Attendance.query.filter_by(student_id=student.id)
            
            if course_id:
                query = query.filter_by(course_id=course_id)
            if start_date:
                query = query.filter(Attendance.date >= start_date)
            if end_date:
                query = query.filter(Attendance.date <= end_date)
            
            records = query.all()
            total = len(records)
            present = sum(1 for r in records if r.status)
            percentage = (present / total * 100) if total > 0 else 0
            
            student_stats.append({
                'student': student,
                'total': total,
                'present': present,
                'absent': total - present,
                'percentage': round(percentage, 2)
            })
        
        report_data = {
            'type': 'overall',
            'student_stats': student_stats
        }
    
    return render_template('report_result.html', report_data=report_data, 
                         start_date=start_date, end_date=end_date)

# Face Recognition Routes
@app.route('/register_face/<int:student_id>')
def register_face(student_id):
    student = Student.query.get_or_404(student_id)
    return render_template('register_face.html', student=student)

@app.route('/capture_face', methods=['POST'])
def capture_face():
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        image_data = data.get('image')
        
        # Decode base64 image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Convert RGB to BGR for face_recognition
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Get face encodings
        face_locations = face_recognition.face_locations(image_np)
        
        if len(face_locations) == 0:
            return jsonify({'success': False, 'message': 'No face detected. Please try again.'})
        
        if len(face_locations) > 1:
            return jsonify({'success': False, 'message': 'Multiple faces detected. Please ensure only one person is in frame.'})
        
        face_encodings = face_recognition.face_encodings(image_np, face_locations)
        face_encoding = face_encodings[0]
        
        # Store face encoding in database
        student = Student.query.get(student_id)
        student.face_encoding = pickle.dumps(face_encoding)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Face registered successfully!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/camera_attendance/<int:course_id>')
def camera_attendance(course_id):
    course = Course.query.get_or_404(course_id)
    return render_template('camera_attendance.html', course=course)

@app.route('/recognize_faces', methods=['POST'])
def recognize_faces():
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        image_data = data.get('image')
        
        # Decode base64 image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Convert RGB to BGR
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Get face locations and encodings
        face_locations = face_recognition.face_locations(image_np)
        face_encodings = face_recognition.face_encodings(image_np, face_locations)
        
        if len(face_encodings) == 0:
            return jsonify({'success': False, 'message': 'No faces detected in the image.'})
        
        # Get all students with face encodings
        students = Student.query.filter(Student.face_encoding.isnot(None)).all()
        
        if not students:
            return jsonify({'success': False, 'message': 'No registered faces in the system.'})
        
        # Load known face encodings
        known_face_encodings = []
        known_student_ids = []
        
        for student in students:
            encoding = pickle.loads(student.face_encoding)
            known_face_encodings.append(encoding)
            known_student_ids.append(student.id)
        
        # Recognize faces
        recognized_students = []
        today = date.today()
        
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            
            if True in matches:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    student_id = known_student_ids[best_match_index]
                    student = Student.query.get(student_id)
                    
                    # Check if attendance already marked today
                    existing = Attendance.query.filter_by(
                        student_id=student_id,
                        course_id=course_id,
                        date=today
                    ).first()
                    
                    if not existing:
                        # Mark attendance
                        attendance = Attendance(
                            student_id=student_id,
                            course_id=course_id,
                            date=today,
                            status=True
                        )
                        db.session.add(attendance)
                        recognized_students.append({
                            'name': student.name,
                            'roll_number': student.roll_number,
                            'status': 'marked'
                        })
                    else:
                        recognized_students.append({
                            'name': student.name,
                            'roll_number': student.roll_number,
                            'status': 'already_marked'
                        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'recognized_count': len(recognized_students),
            'students': recognized_students
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
