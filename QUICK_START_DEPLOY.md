# 🚀 IoT Sensor Management System - Deployment Ready!

## ✅ What's Been Completed

### Backend
- ✅ Express.js API with TypeScript
- ✅ Authentication system (JWT + bcrypt)
- ✅ DynamoDB integration
- ✅ Relay control endpoints
- ✅ Sensor data logging
- ✅ Production build configured
- ✅ Procfile for Elastic Beanstalk
- ✅ Railway.app config
- ✅ Docker support

### Frontend
- ✅ Next.js 16 application
- ✅ React Context for auth
- ✅ Login/Signup pages
- ✅ Dashboard with controls
- ✅ Sensor visualization
- ✅ Weather widget
- ✅ Deployed on Amplify
- ✅ Dark mode support

### Infrastructure
- ✅ AWS DynamoDB (4 tables)
- ✅ AWS IAM configured
- ✅ AWS credentials in .env
- ✅ CORS enabled
- ✅ Environment variables setup

---

## 🎯 Deployment Steps (Choose One Option)

### **Option 1: Railway.app (EASIEST - Recommended)**

1. **Go to https://railway.app**
2. **Sign up with GitHub**
3. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select `jamelswift/Project004`
4. **Configure Backend:**
   - Root directory: `backend`
   - Build command: `npm run build`
   - Start command: `npm start`
5. **Set Environment Variables in Railway Dashboard:**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-random-secret-key>
   AWS_REGION=ap-southeast-1
   AWS_ACCESS_KEY_ID=<from-.env>
   AWS_SECRET_ACCESS_KEY=<from-.env>
   DYNAMODB_SENSOR_DATA_TABLE=SensorData
   DYNAMODB_DEVICE_STATUS_TABLE=DeviceStatus
   DYNAMODB_NOTIFICATION_LOGS_TABLE=NotificationLogs
   DYNAMODB_USERS_TABLE=Users
   ```
6. **Deploy:** Click "Deploy" button
7. **Get URL:** Railway will provide public URL like `https://iot-api-prod.railway.app`

### **Option 2: AWS Elastic Beanstalk**

Requires additional IAM permissions. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

### **Option 3: EC2 + Docker**

For full control over infrastructure. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

---

## 🔄 Update Frontend After Backend Deployment

1. **Get backend URL from deployment** (e.g., `https://iot-api-prod.railway.app`)

2. **In Amplify Console:**
   - Go to https://console.aws.amazon.com/amplify
   - Select your app
   - Go to **Deployments > Environment variables**
   - Add/Update: `NEXT_PUBLIC_API_URL=<your-backend-url>`

3. **Redeploy frontend:**
   - Push code to GitHub (this triggers auto-deploy in Amplify)
   - Or manually trigger deploy in Amplify console

---

## 📝 Update ESP32 with Production URL

Edit `hardware/esp32-light-control.ino`:
```cpp
// Change this line:
const char* STATE_URL = "http://localhost:5000/api/relay/state";

// To your production URL:
const char* STATE_URL = "https://your-production-backend-url/api/relay/state";
```

---

## ✔️ Verification Checklist

After deployment, test these:

```bash
# 1. Test health endpoint
curl https://your-backend-url/health

# 2. Test user registration
curl -X POST https://your-backend-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"securePassword123",
    "name":"Test User"
  }'

# 3. Test login
curl -X POST https://your-backend-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"securePassword123"
  }'

# 4. Check user in DynamoDB
# Go to AWS Console > DynamoDB > Tables > Users
# Verify new user entry with hashed password

# 5. Test frontend at your Amplify URL
# Try login flow
# Check relay control works
```

---

## 🔐 Security Notes

- ⚠️ **Change JWT_SECRET** to a secure random value (min 32 characters)
- ⚠️ **Rotate AWS credentials** after initial setup
- ⚠️ **Enable SSL/HTTPS** (Railway.app does this automatically)
- ⚠️ **Consider IAM roles** instead of access keys in production
- ⚠️ **Enable CloudWatch logs** for monitoring

---

## 📊 System Architecture (Production)

```
┌─────────────────────────────────────────────────┐
│              ESP32 Hardware                      │
│  (WiFi enabled, sends data to production API)   │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│         Railway.app Backend Node.js              │
│  ✓ Express API                                  │
│  ✓ JWT Authentication                          │
│  ✓ DynamoDB data logging                       │
│  ✓ Public HTTPS URL                            │
└────────────────┬────────────────────────────────┘
                 │ AWS SDK
                 ▼
┌─────────────────────────────────────────────────┐
│       AWS DynamoDB (ap-southeast-1)             │
│  • SensorData table                             │
│  • DeviceStatus table                           │
│  • NotificationLogs table                       │
│  • Users table (with auth)                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│      AWS Amplify Frontend (React/Next.js)       │
│  ✓ Login/Signup                                 │
│  ✓ Dashboard                                    │
│  ✓ Relay control                               │
│  ✓ Sensor data visualization                   │
│  ✓ Auto-deployed from GitHub                   │
└────────────────┬────────────────────────────────┘
                 │ HTTPS to Railway backend
                 ▼
         [Production API]
```

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check environment variables in deployment console
- Verify AWS credentials are valid
- Check DynamoDB tables exist in correct region

**Login fails:**
- Check Users table in DynamoDB
- Verify JWT_SECRET is set correctly
- Check backend logs in Railway/EB dashboard

**Frontend can't reach API:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS is enabled in backend
- Test API directly with curl

**Relay control not working:**
- Verify ESP32 has correct backend URL
- Check relay state is being logged to DynamoDB
- Monitor CloudWatch logs if available

---

## 📞 Support

For issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup
2. Review backend logs in deployment dashboard
3. Check frontend deployment logs in Amplify console
4. Verify DynamoDB tables and data in AWS console

---

**System ready for production deployment! 🎉**

