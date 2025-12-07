# Quick Start Guide



### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Set Up Environment (2 min)



**Edit `.env` with YOUR credentials:**

```env
# Paste your MySQL credentials here
DB_HOST=localhost
DB_PORT=3306
DB_NAME=incident_reporting
DB_USER=root
DB_PASSWORD=your-password

# For testing emails, use Mailtrap (free)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

### Step 3: Start Server (1 min)

```bash
npm run dev
```

**You should see:**
```
✅ Database connection established successfully
✅ Database models synchronized
🚀 Server is running on port 5000
```

### Step 4: Test API (1 min)

Open browser: `http://localhost:5000`

**Or use curl:**
```bash
curl http://localhost:5000/api/health
```

## ✅ That's it!

Your backend is now running and ready to connect with the frontend!

---

## 🗄️ Need a MySQL Database?

### Option 1: Local MySQL
1. Install MySQL locally
2. Create database: `CREATE DATABASE incident_reporting;`
3. Use credentials in `.env`

### Option 2: PlanetScale (Free MySQL Cloud)
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up (free tier available)
3. Create a database
4. Copy connection details
5. Paste credentials into `.env`

### Option 3: Railway (Recommended for Cloud)
1. Go to [railway.app](https://railway.app)
2. Create project
3. Add MySQL service
4. Copy connection details
5. Paste into `.env`

---



All emails will be caught by Mailtrap - perfect for testing!

---

## 🔧 Troubleshooting

### Can't connect to database?
- Check credentials in `.env`
- Ensure database exists
- For cloud databases, set `DB_SSL=true`

### Port 5000 already in use?
Change port in `.env`:
```env
PORT=8000
```



## 📚 Full Documentation

- **Complete Backend Guide**: See `README.md`
- **Frontend Integration**: See `/BACKEND_INTEGRATION_GUIDE.md` (in root folder)
- **API Endpoints**: See `README.md` API Endpoints section

---

## Next Steps

1. ✅ Backend is running
2. 🔄 Start the frontend: `cd .. && npm run dev`
3. 🧪 Test creating incidents and notifications
4. 📧 Check Mailtrap for emails
5. 🚀 Deploy to production when ready!

---

