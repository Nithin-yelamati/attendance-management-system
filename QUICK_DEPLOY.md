# Quick Deployment Guide

## Option 1: Deploy on Local Network (5 minutes)

**Perfect for: School/College/Office internal use**

### Steps:

1. **Update app.py** - Change the last line:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

2. **Find your computer's IP address:**
```bash
ipconfig
```
Look for IPv4 Address (e.g., 192.168.1.100)

3. **Run the app:**
```bash
python app.py
```

4. **Access from any device on same WiFi:**
```
http://YOUR_IP:5000
```
Example: `http://192.168.1.100:5000`

✅ **Done!** Anyone on your network can now access the system.

---

## Option 2: Deploy Online (Free) - Render.com

**Perfect for: Public access, remote users**

### Steps:

1. **Install gunicorn:**
```bash
pip install gunicorn
```

2. **Create GitHub account** (if you don't have one):
   - Go to https://github.com
   - Sign up

3. **Upload your code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

4. **Deploy on Render:**
   - Go to https://render.com
   - Sign up (free)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Click "Create Web Service"
   - Wait 5-10 minutes

✅ **Done!** Your app is live at: `https://your-app-name.onrender.com`

---

## Option 3: Use ngrok (Instant Public URL)

**Perfect for: Quick testing, temporary public access**

### Steps:

1. **Download ngrok:**
   - Go to https://ngrok.com
   - Download and extract

2. **Run your Flask app:**
```bash
python app.py
```

3. **In another terminal, run ngrok:**
```bash
ngrok http 5000
```

4. **Copy the public URL** (e.g., https://abc123.ngrok.io)

✅ **Done!** Share this URL with anyone - works from anywhere!

**Note:** Free ngrok URLs change each time you restart.

---

## Comparison

| Method | Setup Time | Cost | Access | Best For |
|--------|-----------|------|--------|----------|
| **Local Network** | 2 min | Free | Same WiFi only | Schools/Offices |
| **Render** | 10 min | Free | Worldwide | Production use |
| **ngrok** | 1 min | Free | Worldwide | Quick demos |

---

## Troubleshooting

### "Camera not working after deployment"
- Camera requires HTTPS
- Use Render (has HTTPS) or ngrok
- Local network works fine for camera

### "Can't access from other devices"
- Check firewall settings
- Make sure devices are on same network
- Try disabling Windows Firewall temporarily

### "App keeps sleeping on Render"
- Free tier sleeps after 15 min of inactivity
- Upgrade to paid plan ($7/month) for 24/7 uptime
- Or use a service like UptimeRobot to ping it

---

## Recommended: Start with Local Network

1. It's the easiest
2. Works perfectly for schools/offices
3. Camera works without issues
4. No internet required
5. Complete privacy

Then upgrade to Render if you need:
- Remote access
- Public availability
- Professional URL

---

## Need Help?

Read the full **DEPLOYMENT_GUIDE.md** for detailed instructions on all deployment options!
