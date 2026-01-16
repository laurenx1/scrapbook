# 🎨 Scrapbook App

A digital scrapbook application with photo uploads, decorations, and music.

## 🚀 Quick Start

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start database
docker-compose up -d

# Run migrations
npm run prisma:migrate

# Start server
npm run dev
```

Server runs on `http://localhost:3000`

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL (Docker)
- **Auth:** JWT, bcrypt

## 📚 API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/scrapbooks` - List scrapbooks
- `POST /api/scrapbooks` - Create scrapbook
- And more...
