# 🚀 Deploying Security Patrol App to Render

This guide explains how to deploy your Security Patrol Tracking System to Render using Docker.

## 📋 Prerequisites

- GitHub/GitLab account with your code repository
- Render account (free tier available at https://render.com)
- Your code pushed to a Git repository

---

## 🔧 Deployment Changes Made

### ✅ What Was Modified:

1. **Created Production Dockerfiles:**
   - `backend/Dockerfile.render` - Production backend with auto-migrations
   - `frontend/Dockerfile.render` - Nginx-based static file serving
   
2. **Added Nginx Configuration:**
   - `frontend/nginx.conf` - Serves React SPA with API proxy

3. **Created Render Blueprint:**
   - `render.yaml` - Infrastructure as Code for Render

4. **Updated CORS Configuration:**
   - Backend now supports production origins

---

## 🎯 Deployment Options

### Option 1: Using Render Blueprint (Recommended)

This deploys all services automatically:

1. **Push Code to Git Repository**
   ```bash
   git add .
   git commit -m "Add Render deployment files"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to https://render.com/dashboard
   - Click "New" → "Blueprint"
   - Connect your repository
   - Select `render.yaml`
   - Click "Apply"

3. **Render Will Automatically Create:**
   - ✅ PostgreSQL Database (Managed)
   - ✅ Backend API Service
   - ✅ Frontend Web Service
   - ✅ All environment variables

4. **Wait for Deployment** (5-10 minutes)
   - Database provisions first
   - Backend builds and runs migrations
   - Frontend builds and serves

---

### Option 2: Manual Service Creation

Deploy each service individually:

#### Step 1: Create PostgreSQL Database

1. **Dashboard** → **New** → **PostgreSQL**
2. **Name:** `security-patrol-db`
3. **Database:** `security_patrol`
4. **User:** `patrol_user`
5. **Plan:** Free or Starter
6. Click **Create Database**
7. **Save the Internal Database URL** (you'll need this)

#### Step 2: Deploy Backend

1. **Dashboard** → **New** → **Web Service**
2. **Connect Repository**
3. **Settings:**
   - **Name:** `security-patrol-backend`
   - **Environment:** Docker
   - **Dockerfile Path:** `./backend/Dockerfile.render`
   - **Plan:** Free or Starter

4. **Environment Variables:**
   ```
   DATABASE_URL=<paste Internal Database URL from Step 1>
   JWT_SECRET=<generate random 64-char string>
   PORT=5000
   NODE_ENV=production
   ```

5. Click **Create Web Service**
6. **Save the backend URL** (e.g., `https://security-patrol-backend.onrender.com`)

#### Step 3: Deploy Frontend

1. **Dashboard** → **New** → **Web Service**
2. **Connect Repository**
3. **Settings:**
   - **Name:** `security-patrol-frontend`
   - **Environment:** Docker
   - **Dockerfile Path:** `./frontend/Dockerfile.render`
   - **Plan:** Free or Starter

4. **Environment Variables:**
   ```
   VITE_API_URL=<paste backend URL from Step 2>
   BACKEND_URL=<paste backend URL from Step 2>
   ```

5. Click **Create Web Service**

---

## 🔐 Environment Variables Reference

### Backend Required Variables:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.onrender.com  # Optional
```

### Frontend Required Variables:
```bash
VITE_API_URL=https://your-backend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
```

---

## 🗄️ Database Setup

### Automatic Migration

The backend Dockerfile automatically runs migrations on startup:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
```

### Manual Seed Data (Optional)

After deployment, seed demo data:

1. **Go to Backend Service** → **Shell**
2. **Run:**
   ```bash
   npm run prisma:seed
   ```

This creates demo users:
- supervisor@security.com / password123
- guard1@security.com / password123
- client@company.com / password123

---

## 🌐 Accessing Your App

After deployment completes:

1. **Frontend URL:** `https://security-patrol-frontend.onrender.com`
2. **Backend API:** `https://security-patrol-backend.onrender.com`
3. **Health Check:** `https://security-patrol-backend.onrender.com/health`

---

## 🔍 Troubleshooting

### Backend Won't Start

**Check Logs:**
- Dashboard → Backend Service → Logs

**Common Issues:**
1. **Database connection failed:**
   - Verify `DATABASE_URL` is correct
   - Check database is running
   - Use **Internal Database URL**, not External

2. **Prisma migration failed:**
   - Check Prisma schema is valid
   - Manually run: `npx prisma migrate deploy`

3. **Port binding error:**
   - Render uses port from `PORT` env var
   - Ensure backend listens on `process.env.PORT`

### Frontend 502 Bad Gateway

**Possible Causes:**
1. **Backend not responding:**
   - Check backend health: `/health` endpoint
   - Verify `VITE_API_URL` points to backend

2. **Build failed:**
   - Check build logs
   - Ensure `npm run build` works locally

3. **Nginx config error:**
   - Verify `nginx.conf` syntax
   - Check file paths in Dockerfile

### CORS Errors

**Fix:**
1. Add frontend URL to backend `CORS_ORIGIN` env var:
   ```
   CORS_ORIGIN=https://your-frontend.onrender.com
   ```

2. Restart backend service

### Slow Performance on Free Tier

**Free tier limitations:**
- Services sleep after 15 min of inactivity
- First request after sleep takes 30-60 seconds
- Database has connection limits

**Solutions:**
- Upgrade to Starter plan ($7/month)
- Use cron job to ping health endpoint every 10 min
- Add loading states in frontend

---

## 💰 Cost Estimate

### Free Tier:
- **PostgreSQL:** Free (expires after 90 days)
- **Backend:** Free (sleeps after inactivity)
- **Frontend:** Free (sleeps after inactivity)
- **Total:** $0/month (limited)

### Starter Tier (Recommended):
- **PostgreSQL:** $7/month
- **Backend:** $7/month
- **Frontend:** $7/month
- **Total:** $21/month (always on, better performance)

---

## 📊 Monitoring

### Health Checks

Backend health endpoint: `/health`
```json
{
  "status": "OK",
  "timestamp": "2026-01-24T10:00:00.000Z"
}
```

### Logs

Access logs from Render Dashboard:
- **Backend:** API requests, errors, migrations
- **Frontend:** Nginx access logs
- **Database:** Connection logs, queries

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Render watches your repository and auto-deploys on push:

1. Make code changes locally
2. Commit and push to Git
3. Render automatically:
   - Detects changes
   - Rebuilds Docker images
   - Runs migrations
   - Deploys new version

### Manual Deploy

Dashboard → Service → Manual Deploy → Deploy Latest Commit

---

## 🛡️ Security Best Practices

### Production Checklist:

- [ ] Change default JWT_SECRET
- [ ] Use strong database password
- [ ] Enable CORS with specific origin
- [ ] Use HTTPS (automatic on Render)
- [ ] Review and limit API rate limits
- [ ] Enable Render's DDoS protection
- [ ] Set up monitoring/alerts
- [ ] Regular database backups

---

## 🆘 Support

### Render Documentation:
- https://render.com/docs
- https://render.com/docs/docker

### Common Commands:

```bash
# View logs
render logs -s security-patrol-backend

# SSH into service
render shell -s security-patrol-backend

# Run migrations manually
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Render account created
- [ ] Database service created
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] Migrations ran successfully
- [ ] Health check returns 200 OK
- [ ] Can login with demo credentials
- [ ] QR scanning works
- [ ] Admin panel accessible
- [ ] All dashboards loading

---

## 🎉 Success!

Your Security Patrol Tracking System is now live on Render!

**Next Steps:**
1. Test all features
2. Create production users via Admin Panel
3. Add your sites and checkpoints
4. Generate QR codes
5. Train your team

---

**Need Help?** Check Render logs or contact support at https://render.com/support
