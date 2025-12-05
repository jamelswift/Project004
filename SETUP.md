# IoT Sensor Management - Setup Guide

## 📋 Project Structure

```
project/
├── app/                    # Next.js App Router (Frontend UI)
├── components/             # React Components
├── lib/                    # Utilities & API clients
├── backend/               # Express.js Backend API
├── public/                # Static files
├── .env.local             # Local dev environment
├── .env.production        # Production environment
├── next.config.mjs        # Next.js config (static export)
├── Dockerfile             # Frontend Docker image
└── docker-compose.yml     # Run both services
```

## 🚀 Quick Start

### Option 1: Local Development

**Terminal 1 - Backend**
```bash
cd backend
npm install
npm run dev
# Running at http://localhost:5000
```

**Terminal 2 - Frontend**
```bash
npm install
npm run dev
# Running at http://localhost:3000
```

Ensure `.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Option 2: Docker

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📦 Build for Production

### Static Export (สำหรับ Amplify)

```bash
npm run build
# สร้าง out/ folder ที่เป็น static HTML + JS
```

### Amplify Deployment

1. Push ไปยัง GitHub
2. เข้า AWS Amplify Console
3. Connected App → Choose Repository
4. Amplify จะโหลด `amplify.yml` automatically
5. Build Settings:
   - baseDirectory: `out`
   - Environment variables: `NEXT_PUBLIC_API_URL=https://your-api.com`

⚠️ **สำคัญ**: ต้องมี Backend API deployed ที่ไหนสักแห่ง (Lambda, EC2, Heroku, etc.)

## 🔧 API URL Configuration

### Development
```
.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Production
```
.env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 🌐 Backend Deployment Options

### 1. AWS Lambda (Serverless) - Recommended
```bash
# ใช้ Serverless Framework
npm install -g serverless
serverless deploy
```

### 2. AWS EC2
```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-instance.com
git clone your-repo
cd backend
npm install
npm start  # หรือใช้ PM2
```

### 3. Heroku
```bash
cd backend
heroku create iot-backend
git push heroku main
```

### 4. Railway.app
- Connect GitHub repo
- Select `backend` directory
- Deploy

## ✅ Testing

### Test Backend API
```bash
curl http://localhost:5000/health
# Response: { "status": "ok", "timestamp": "..." }
```

### Test Frontend Connection
- Open http://localhost:3000
- ควรเห็นข้อมูล Devices, Sensors, Weather
- ลองเปิด/ปิด devices

## 🔑 Environment Variables

### Backend (.env)
- `PORT` - API port (default 5000)
- `NODE_ENV` - development/production
- `WEATHER_API_KEY` - OpenWeatherMap key

### Frontend (.env.local / .env.production)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 📚 API Documentation

ดู `backend/README.md` สำหรับ endpoint details

## 🐛 Troubleshooting

### Frontend ไม่ connect กับ Backend
1. Check backend running: `curl http://localhost:5000/health`
2. Check `.env.local`: `NEXT_PUBLIC_API_URL` ต้องถูกต้อง
3. Check Browser DevTools → Network tab → ดู API requests
4. Check CORS errors

### Static Export Error
1. ต้องไม่มี API routes ในแต่ละ page
2. ต้องใช้ `getStaticProps` หรือ client-side fetch
3. Check `next.config.mjs`: `output: 'export'` ต้องมี

### Build Errors
```bash
# Clean build
rm -rf .next out node_modules
npm install
npm run build
```

## 🚀 Production Checklist

- [ ] Backend deployed & running
- [ ] API URL updated in `.env.production`
- [ ] CORS configured for frontend domain
- [ ] Build tested locally: `npm run build`
- [ ] Static export verified: `out/` folder exists
- [ ] Amplify build settings configured
- [ ] Database connected (if needed)
- [ ] Error logging setup
- [ ] Performance monitoring setup

## 📝 Notes

- Frontend สร้างเป็น static HTML ไม่ต้อง SSR
- Backend ต้องรัน 24/7 บน server แยก
- ข้อมูลจัดเก็บใน memory - ต้องมี Database จริง
- CORS ต้องตั้งค่าให้ถูกต้องเพื่อ security
