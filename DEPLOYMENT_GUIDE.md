# Deployment Guide - Institutional Attendance Management System

This guide covers multiple deployment options for your attendance system.

---

## Table of Contents
1. [Local Network Deployment (Easiest)](#1-local-network-deployment)
2. [Cloud Deployment - Render (Free)](#2-render-deployment)
3. [Cloud Deployment - PythonAnywhere (Free)](#3-pythonanywhere-deployment)
4. [Cloud Deployment - Heroku](#4-heroku-deployment)
5. [Production Best Practices](#5-production-best-practices)

---

## 1. Local Network Deployment (Easiest)

Deploy on your local network so other computers can access it.

### Step 1: Update app.py

Change the last line in `app.py`:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Step 2: Find Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Linux/Mac:**
```bash
ifconfig
```

### Step 3: Run the Application

```bash
python app.py
```

### Step 4: Access from Other Devices

On any device on the same network, open browser and go to:
```
http://YOUR_IP_ADDRESS:5000
```
Example: `http://192.168.1.100:5000`

### Step 5: Keep It Running

**Windows - Use Task Scheduler:**
- Create a batch file `start_attendance.bat`:
```batch
cd C:\Users\pc\CascadeProjects\windsurf-project
python app.py
```
- Schedule it to run at startup

**Linux - Use systemd:**
Create `/etc/systemd/system/attendance.service`

---

## 2. Render Deployment (Free, Recommended)

Render offers free hosting for web applications.

### Step 1: Prepare for Production

Create `gunicorn` configuration file:

```bash
pip install gunicorn
```

Update `requirements.txt`:
```
Flask==2.3.3
Flask-SQLAlchemy==3.1.1
Flask-Login==0.6.2
Werkzeug==2.3.7
python-dotenv==1.0.0
opencv-python-headless==4.8.1.78
face-recognition==1.3.0
numpy==1.24.3
Pillow==10.0.0
gunicorn==21.2.0
```

### Step 2: Create `render.yaml`

```yaml
services:
  - type: web
    name: attendance-system
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

### Step 3: Update app.py for Production

Add at the top:
```python
import os

# Production configuration
if os.environ.get('RENDER'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/attendance.db'
```

### Step 4: Deploy to Render

1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or upload code)
4. Render will auto-detect Python
5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment

**Your app will be live at:** `https://your-app-name.onrender.com`

---

## 3. PythonAnywhere Deployment (Free)

### Step 1: Create Account

Sign up at https://www.pythonanywhere.com (Free tier available)

### Step 2: Upload Code

1. Go to "Files" tab
2. Upload your project files
3. Or use Git to clone your repository

### Step 3: Create Virtual Environment

In Bash console:
```bash
mkvirtualenv --python=/usr/bin/python3.10 attendance-env
pip install -r requirements.txt
```

### Step 4: Configure Web App

1. Go to "Web" tab
2. Click "Add a new web app"
3. Choose "Flask"
4. Set source code path: `/home/yourusername/windsurf-project`
5. Set WSGI file to point to your app

Edit WSGI configuration file:
```python
import sys
path = '/home/yourusername/windsurf-project'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

### Step 5: Reload Web App

Click "Reload" button

**Your app will be live at:** `https://yourusername.pythonanywhere.com`

---

## 4. Heroku Deployment

### Step 1: Install Heroku CLI

Download from: https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Create Procfile

Create file named `Procfile` (no extension):
```
web: gunicorn app:app
```

### Step 3: Create runtime.txt

```
python-3.11.0
```

### Step 4: Deploy

```bash
heroku login
heroku create attendance-system-app
git init
git add .
git commit -m "Initial commit"
git push heroku main
heroku open
```

---

## 5. Production Best Practices

### Security Enhancements

#### 1. Use Environment Variables

Create `.env` file:
```
SECRET_KEY=your-very-secret-key-here-change-this
DATABASE_URL=sqlite:///attendance.db
FLASK_ENV=production
```

Update `app.py`:
```python
from dotenv import load_dotenv
import os

load_dotenv()

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///attendance.db')
```

#### 2. Add User Authentication

Install Flask-Login (already in requirements):
```bash
pip install Flask-Login
```

#### 3. Use HTTPS

- For local: Use ngrok (https://ngrok.com)
- For cloud: Most platforms provide free SSL

#### 4. Database Backup

Create `backup.py`:
```python
import shutil
from datetime import datetime

backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
shutil.copy('instance/attendance.db', f'backups/{backup_name}')
print(f"Backup created: {backup_name}")
```

Run daily:
```bash
python backup.py
```

### Performance Optimization

#### 1. Use PostgreSQL for Production

```bash
pip install psycopg2-binary
```

Update database URI:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/attendance'
```

#### 2. Enable Caching

```bash
pip install Flask-Caching
```

#### 3. Optimize Face Recognition

- Process images in background using Celery
- Store face encodings efficiently
- Limit image size before processing

### Monitoring

#### 1. Add Logging

```python
import logging

logging.basicConfig(filename='attendance.log', level=logging.INFO)
```

#### 2. Error Tracking

Use Sentry:
```bash
pip install sentry-sdk[flask]
```

---

## Quick Deployment Comparison

| Platform | Cost | Difficulty | Best For |
|----------|------|------------|----------|
| **Local Network** | Free | Easy | School/Office LAN |
| **Render** | Free | Easy | Public access, small scale |
| **PythonAnywhere** | Free | Easy | Educational projects |
| **Heroku** | $7/mo | Medium | Production apps |
| **AWS/Azure** | Variable | Hard | Enterprise scale |

---

## Recommended: Render Deployment (Step by Step)

### Complete Setup for Render:

1. **Install gunicorn:**
```bash
pip install gunicorn
pip freeze > requirements.txt
```

2. **Create `Procfile`:**
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

3. **Update `app.py` (last line):**
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

4. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

5. **Deploy on Render:**
- Go to https://render.com
- Sign up/Login
- Click "New +" → "Web Service"
- Connect GitHub repository
- Set:
  - **Name:** attendance-system
  - **Environment:** Python 3
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `gunicorn app:app`
- Click "Create Web Service"

6. **Wait 5-10 minutes** - Your app will be live!

---

## Troubleshooting

### Camera Not Working on Deployed Site

**Issue:** Browser requires HTTPS for camera access

**Solution:**
- Use Render/Heroku (provides free HTTPS)
- Or use ngrok for local deployment:
```bash
ngrok http 5000
```

### Database Resets on Render

**Issue:** Free tier uses ephemeral storage

**Solution:**
- Upgrade to paid plan with persistent disk
- Or use external database (PostgreSQL on Render)

### Face Recognition Too Slow

**Solution:**
- Reduce image resolution before processing
- Use background job processing (Celery + Redis)
- Upgrade to better server instance

---

## Need Help?

- Check logs: `heroku logs --tail` (Heroku) or Render dashboard
- Test locally first: `python app.py`
- Ensure all dependencies in requirements.txt
- Check Python version compatibility

---

## Next Steps After Deployment

1. ✅ Test all features on deployed site
2. ✅ Set up regular database backups
3. ✅ Add user authentication
4. ✅ Monitor application logs
5. ✅ Set up custom domain (optional)
6. ✅ Enable HTTPS (automatic on most platforms)

Your attendance system is now ready for production use! 🚀
