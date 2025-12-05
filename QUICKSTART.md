# 🚀 IoT Sensor Management - Complete Setup Guide

## ✅ What's Been Done

### 1. ✨ Backend API Created
- **Location**: `/backend` folder
- **Framework**: Express.js + CORS enabled
- **Port**: 5000
- **Features**:
  - ✅ All API endpoints implemented
  - ✅ Mock data in memory (can connect to DB later)
  - ✅ CORS enabled for frontend

### 2. 🎯 Frontend Updated
- **Remove**: `/app/api/**` (all API routes deleted)
- **Updated**: All components/pages to call backend instead
- **Config**: `NEXT_PUBLIC_API_URL` environment variable

### 3. 📦 Static Export Ready
- **next.config.mjs**: ✅ `output: 'export'` configured
- **Build**: ✅ `npm run build` creates `/out` folder
- **Deployment**: Ready for Amplify S3 hosting

### 4. 🐳 Docker Support
- **docker-compose.yml**: Run both services together
- **Dockerfile**: Multi-stage build for production

## 🎮 Quick Start - Local Development

### Terminal 1: Backend
```bash
cd backend
npm install  # Already done
npm run dev  # or: npm start
```
✅ Backend runs at `http://localhost:5000`

### Terminal 2: Frontend
```bash
npm install  # Already done
npm run dev
```
✅ Frontend runs at `http://localhost:3000`

**Note**: `.env.local` is already configured with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🧪 Testing

### Test Backend API
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"..."}
```

### Test Frontend
- Open `http://localhost:3000`
- Dashboard should load with data
- Try controlling devices
- Check Network tab in DevTools for API calls

## 🚀 Production Deployment

### Step 1: Build Static Frontend
```bash
npm run build
# Creates: /out folder with static HTML/JS
```

### Step 2: Deploy Frontend (Amplify)
1. Push to GitHub
2. Connect AWS Amplify
3. Amplify automatically uses `/amplify.yml`
4. Deploy `/out` folder to S3 + CloudFront

### Step 3: Deploy Backend
Choose one option:

**Option A: AWS Lambda** (Recommended)
```bash
cd backend
npm run build  # if you need to compile
# Deploy with Serverless Framework
```

**Option B: AWS EC2**
```bash
# SSH into EC2
git clone your-repo
cd backend
npm install
npm start  # or use PM2
```

**Option C: Heroku**
```bash
heroku create iot-backend
git push heroku main
```

**Option D: Railway.app**
- Connect GitHub → select `/backend` folder → Deploy

### Step 4: Update Frontend .env.production
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

Rebuild and redeploy frontend.

## 📁 Project Structure

```
project/
├── app/                    # Next.js frontend (✅ no /api anymore)
├── components/             # React components (✅ updated)
├── lib/                    # Utilities (✅ updated)
├── backend/                # 🆕 Express.js API
│   ├── server.js          # Main server file
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
├── public/                 # Static assets
├── .env.local             # 🆕 Dev environment
├── .env.production        # 🆕 Prod environment
├── next.config.mjs        # ✅ Static export configured
├── amplify.yml            # 🆕 Amplify build config
├── Dockerfile             # 🆕 Frontend Docker
├── docker-compose.yml     # 🆕 Local dev with Docker
└── SETUP.md               # This file
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Devices
```
GET /api/devices
POST /api/devices { deviceId, status }
```

### Sensors
```
GET /api/sensors
POST /api/sensors { sensorId, value }
```

### IoT
```
POST /api/iot/publish { topic, command }
```

### Weather
```
GET /api/weather?city=Bangkok
```

### Simulator
```
POST /api/simulator/start
POST /api/simulator/stop
POST /api/simulator/generate
```

### Notifications
```
GET /api/notifications
POST /api/notifications/email { to, subject, message }
```

## 🐳 Docker Deployment

### Build & Run Locally
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## ⚠️ Important Notes

1. **Data Persistence**: Current backend stores data in memory
   - Data is lost when server restarts
   - For production: connect to MongoDB/PostgreSQL

2. **Authentication**: Not implemented yet
   - Add JWT token validation before production
   - Secure API endpoints with proper auth

3. **CORS**: Currently allows all origins
   - In production: restrict to your domain
   - Update `cors()` in `backend/server.js`

4. **Environment Variables**: 
   - Frontend: `NEXT_PUBLIC_` prefix for client-side access
   - Backend: Sensitive keys never exposed to frontend

## 📊 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 16.0.3 |
| Frontend Build | Static Export | ✅ |
| Backend | Express.js | 4.18.2 |
| Database | Memory (In-Dev) | - |
| Deployment | AWS Amplify | ✅ |
| Container | Docker | ✅ |

## 🎯 Next Steps

1. **Local Testing** ✅ (You are here)
   - [ ] Start backend: `cd backend && npm start`
   - [ ] Start frontend: `npm run dev`
   - [ ] Open http://localhost:3000
   - [ ] Test device control, sensors, weather

2. **Database Integration** (Optional)
   - [ ] Install MongoDB/PostgreSQL
   - [ ] Update `backend/server.js` with DB queries
   - [ ] Replace in-memory `db` object

3. **Authentication** (Optional)
   - [ ] Install JWT package
   - [ ] Add login/signup endpoints
   - [ ] Protect sensitive routes

4. **Production Deploy**
   - [ ] Build frontend: `npm run build`
   - [ ] Deploy backend (Lambda/EC2/Heroku)
   - [ ] Deploy frontend (Amplify)
   - [ ] Update `.env.production`
   - [ ] Configure CI/CD pipeline

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
Get-NetTCPConnection -LocalPort 5000  # Windows

# Kill the process and retry
npm start
```

### Frontend API errors
1. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
2. Ensure backend is running
3. Check DevTools Network tab for 403/404 errors
4. Verify CORS is enabled

### Build failures
```bash
# Clean build
rm -rf .next out node_modules
npm install
npm run build
```

### Port already in use
```bash
# Use different port
PORT=3001 npm run dev
```

## 📞 Support

- Backend README: `backend/README.md`
- Full Setup Guide: `SETUP.md`
- Issues? Check `/out` folder created after build

## 🎉 You're All Set!

Your frontend is now:
- ✅ Decoupled from backend
- ✅ Ready for static export
- ✅ Can be deployed to Amplify
- ✅ Calls external API backend

Your backend is now:
- ✅ Ready to run independently
- ✅ Can be deployed anywhere
- ✅ CORS enabled for frontend
- ✅ All endpoints implemented

Happy coding! 🚀
