# Camera-Based Attendance System Setup Guide

## Overview
The system now supports **automatic attendance marking using facial recognition** through your webcam!

## Installation Steps

### Step 1: Install Required Packages

Run this command to install all dependencies including face recognition libraries:

```bash
pip install -r requirements.txt
```

**Note:** Installing `face-recognition` may take some time as it requires:
- dlib (C++ library)
- cmake (build tool)
- Visual Studio Build Tools (on Windows)

### Step 2: Install System Dependencies (Windows)

If you encounter errors installing face-recognition on Windows:

1. Install **Visual Studio Build Tools**:
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++"

2. Install **CMake**:
   - Download from: https://cmake.org/download/
   - Add to PATH during installation

### Step 3: Run the Application

```bash
python app.py
```

## How to Use Camera-Based Attendance

### 1. Register Student Faces

Before using camera attendance, you must register each student's face:

1. Go to **Students** page
2. Click the **camera icon** (📷) next to a student's name
3. Allow browser to access your webcam
4. Position the student's face in the camera view
5. Click **"Capture Face"**
6. System will detect and register the face
7. Repeat for all students

**Important Tips:**
- Ensure good lighting
- Only one face should be visible
- Face should be clearly visible and front-facing
- Remove glasses/masks if possible for better accuracy

### 2. Mark Attendance Using Camera

Once faces are registered:

1. Go to **Attendance** page
2. Select a course
3. Click **"Camera Attendance"** button
4. Position students in front of the camera (can be multiple students)
5. Click **"Capture & Mark Attendance"**
6. System will:
   - Detect all faces in the frame
   - Recognize registered students
   - Automatically mark them present
   - Show list of recognized students

### 3. Manual Attendance (Backup Option)

You can still mark attendance manually:

1. Go to **Attendance** page
2. Select a course
3. Click **"Manual Attendance"** button
4. Mark each student as Present/Absent
5. Click **"Save Attendance"**

## Features

✅ **Automatic Face Detection** - Detects multiple faces in one frame
✅ **Face Recognition** - Matches faces with registered students
✅ **Duplicate Prevention** - Won't mark attendance twice for same day
✅ **Real-time Feedback** - Shows recognized students immediately
✅ **Manual Backup** - Manual attendance option always available
✅ **Secure Storage** - Face encodings stored securely in database

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure no other application is using the camera
- Try a different browser (Chrome/Edge recommended)

### Face Not Detected
- Improve lighting conditions
- Move closer to camera
- Ensure face is front-facing
- Remove obstructions (glasses, masks)

### Face Not Recognized
- Re-register the student's face
- Ensure good lighting during registration
- Try multiple angles during registration
- Check if face encoding was saved (should see success message)

### Installation Errors (face-recognition)
- Install Visual Studio Build Tools
- Install CMake
- Restart terminal/IDE after installation
- Try: `pip install --upgrade pip setuptools wheel`

## System Requirements

- **Python**: 3.7 or higher
- **Webcam**: Any USB or built-in webcam
- **Browser**: Chrome, Edge, or Firefox (with camera permissions)
- **RAM**: Minimum 4GB (8GB recommended)
- **OS**: Windows 10/11, Linux, or macOS

## Privacy & Security

- Face encodings are stored as binary data (not images)
- No actual photos are saved
- Data is stored locally in SQLite database
- Camera access only when explicitly requested
- All processing happens on your server

## Performance Tips

1. **Good Lighting**: Ensure well-lit environment
2. **Camera Quality**: Higher resolution cameras work better
3. **Distance**: Keep 2-3 feet from camera
4. **Multiple Students**: Can recognize 5-10 faces simultaneously
5. **Processing Time**: Takes 2-5 seconds per capture

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Run application: `python app.py`
3. Add students
4. Register their faces
5. Start marking attendance with camera!

For any issues, check the console output for detailed error messages.
