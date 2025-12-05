# IoT Sensor Management - Frontend

Next.js frontend application for IoT Sensor Management system.

## 📦 Requirements

- Node.js 18+
- npm or pnpm
- Backend API running (default: http://localhost:5000)

## 🚀 Quick Start

### Development
```bash
npm run dev
# Frontend runs at http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

## 🔧 Configuration

Environment variables (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production (`.env.production`):
```
NEXT_PUBLIC_API_URL=https://your-api.com
```

## 📁 Project Structure

```
frontend/
├── app/                 # Next.js app router
│   ├── admin/          # Admin pages
│   ├── dashboard/      # Dashboard pages
│   ├── api/            # (Removed - use external API)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/          # Reusable React components
│   ├── ui/             # UI components
│   ├── dashboard-charts.tsx
│   ├── device-control.tsx
│   └── ...
├── lib/                # Utilities & helpers
│   ├── api functions   # (Updated to call backend)
│   ├── auth.ts
│   ├── aws-iot.ts
│   ├── weather.ts
│   └── ...
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── styles/             # Global styles
├── public/             # Static assets
├── types/              # TypeScript types
├── next.config.mjs     # Next.js config (static export)
├── tsconfig.json       # TypeScript config
├── package.json        # Dependencies
└── out/                # Static build output
```

## 🎯 Features

- ✅ Device Management - Control IoT devices
- ✅ Sensor Monitoring - View sensor data in real-time
- ✅ Weather Widget - Display weather information
- ✅ Dashboard - Overview of all data
- ✅ Admin Panel - Manage devices and settings
- ✅ Responsive UI - Works on mobile & desktop

## 🔌 API Integration

All API calls point to backend:
- Base URL: `http://localhost:5000` (dev) or `https://api.yourdomain.com` (prod)
- Environment variable: `NEXT_PUBLIC_API_URL`

### Updated Components
- `components/device-control.tsx` - Calls `/api/devices`
- `components/weather-widget.tsx` - Calls `/api/weather`
- `app/dashboard/control/page.tsx` - Device control page
- `app/dashboard/history/page.tsx` - Sensor history page
- `app/admin/page.tsx` - Admin dashboard

## 🚀 Deployment

### AWS Amplify
```bash
npm run build
# Amplify uses amplify.yml to deploy /out folder to S3 + CloudFront
```

### Docker
```bash
docker build -t iot-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:5000 iot-frontend
```

### Static Export
This frontend is configured for static export (no SSR required):
```bash
npm run build
# Creates: /out folder with static HTML/CSS/JS
```

## 📖 Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production (static export)
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🔐 Environment

- **Development**: `.env.local` (API_URL = http://localhost:5000)
- **Production**: `.env.production` (API_URL = https://your-api.com)

## 📝 Notes

- API routes (`/api/**`) have been removed - use external backend
- Static export enabled - no server-side rendering
- All API calls use `NEXT_PUBLIC_API_URL` environment variable
- CORS handled by backend

## 🆘 Troubleshooting

**API calls failing?**
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Ensure backend is running on port 5000
- Check DevTools Network tab for errors
- Verify CORS is enabled on backend

**Build errors?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Port 3000 already in use?**
```bash
PORT=3001 npm run dev
```

## 📚 Documentation

- Main README: `../README.md`
- API Testing: `../API_TESTING.md`
- Setup Guide: `../SETUP.md`
- Quick Start: `../QUICKSTART.md`

---

**Backend**: `../backend/`
**Status**: Production Ready ✅
