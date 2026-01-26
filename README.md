# Security Patrol Tracking System - MVP

A modern web-based patrol tracking system to replace paper logbooks with digital, tamper-resistant patrol records and real-time visibility for supervisors.

## 🎯 Features

### Guard Features
- **Digital Shift Management**: Start and end shifts with automatic timestamp
- **QR Code Scanning**: Scan checkpoints using device camera
- **GPS Tracking**: Auto-capture location data for each checkpoint
- **Patrol History**: View current shift progress and past patrols

### Supervisor Features
- **Live Dashboard**: Real-time visibility of all active patrols
- **Alerts System**: Automatic alerts for missed checkpoints
- **Guards Monitoring**: Track which guards are on duty
- **Patrol Timeline**: View detailed patrol history with timestamps

## 🧰 Technology Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with role-based access
- **QR Scanning**: html5-qrcode
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd "C:\Users\ADMIN\OneDrive\Desktop\security app"
```

### 2. Start the Application

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on http://localhost:5000
- Frontend application on http://localhost:3000

### 3. Initialize the Database

In a new terminal, run:

```bash
# Enter the backend container
docker exec -it security-patrol-backend sh

# Run migrations
npx prisma migrate deploy

# Seed demo data
npm run prisma:seed

# Exit container
exit
```

### 4. Access the Application

Open your browser and go to: **http://localhost:3000**

## 👥 Demo Credentials

### Guard Account
- Email: `guard1@security.com`
- Password: `password123`

### Supervisor Account
- Email: `supervisor@security.com`
- Password: `password123`



## 📁 Project Structure

```
security-patrol-mvp/
│
├── docker-compose.yml          # Docker orchestration
│
├── backend/                    # Node.js Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma      # Database models
│   │   └── seed.js            # Demo data
│   └── src/
│       ├── app.js             # Express app
│       ├── server.js          # Server entry
│       ├── config/
│       │   └── db.js          # Prisma client
│       ├── middleware/
│       │   └── auth.middleware.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── patrol.routes.js
│       │   └── supervisor.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── patrol.controller.js
│       │   └── supervisor.controller.js
│       └── utils/
│           └── jwt.js
│
└── frontend/                   # React Frontend
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx           # App entry
        ├── App.jsx            # Routes
        ├── api/
        │   └── client.js      # API client
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   └── QRScanner.jsx
        └── pages/
            ├── Login.jsx
            ├── GuardDashboard.jsx
            └── SupervisorDashboard.jsx
```

## 🔑 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Patrol (Guard)
- `POST /patrol/start-shift` - Start a new shift
- `PUT /patrol/end-shift/:shiftId` - End active shift
- `POST /patrol/log-checkpoint` - Log checkpoint scan
- `GET /patrol/active-shift` - Get guard's active shift
- `GET /patrol/shift/:shiftId` - Get shift details
- `GET /patrol/history` - Get patrol history

### Supervisor
- `GET /supervisor/live-patrols` - Get all active patrols
- `GET /supervisor/alerts` - Get missed checkpoint alerts
- `GET /supervisor/shifts` - Get all shifts (with filters)
- `GET /supervisor/guards-on-duty` - Get guards currently on duty
- `GET /supervisor/patrol-timeline` - Get patrol timeline

## 🗄️ Database Models

### User
- Roles: GUARD, SUPERVISOR
- Email-based authentication with bcrypt password hashing

### Site
- Physical locations where patrols occur
- GPS coordinates stored

### Checkpoint
- Physical checkpoints with unique QR codes
- Associated with specific sites

### Shift
- Guard work periods
- Tracks start/end times and status

### PatrolLog
- Individual checkpoint visits
- Captures timestamp and GPS coordinates

## 🔐 Security Features

- JWT-based authentication with 7-day expiry
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- GPS verification for checkpoint logs
- Tamper-resistant timestamp records

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## 📱 Mobile Usage

The application is mobile-first and works on:
- Modern mobile browsers (Chrome, Safari, Firefox)
- Tablets
- Desktop browsers

**QR Scanning** requires camera permissions on mobile devices.

## 🧪 Testing the System

### Test Guard Flow
1. Login as guard1@security.com
2. Select "Downtown Office Complex"
3. Click "Start Shift"
4. Click "Scan Checkpoint"
5. Use QR code: `SITE1-CHECKPOINT-001`
6. View logged checkpoint
7. End shift

### Test Supervisor Flow
1. Login as supervisor@security.com
2. View live patrols dashboard
3. Check alerts for missed checkpoints
4. Monitor guards on duty


## 🐳 Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild images
docker-compose up --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://patrol_user:patrol_pass@postgres:5432/security_patrol
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 📊 Sample QR Codes for Testing

- **Site 1 - Main Entrance**: `SITE1-CHECKPOINT-001`
- **Site 1 - North Wing**: `SITE1-CHECKPOINT-002`
- **Site 1 - Parking Lot**: `SITE1-CHECKPOINT-003`
- **Site 1 - Emergency Exit**: `SITE1-CHECKPOINT-004`
- **Site 2 - Main Gate**: `SITE2-CHECKPOINT-001`
- **Site 2 - Loading Dock**: `SITE2-CHECKPOINT-002`
- **Site 2 - Storage Area**: `SITE2-CHECKPOINT-003`

Generate QR codes at: https://www.qr-code-generator.com/

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Restart PostgreSQL container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
```

### Port Conflicts
If ports 3000 or 5000 are already in use:
1. Stop the conflicting service
2. Or modify ports in docker-compose.yml

## 🎯 Production Deployment

For production deployment:

1. **Change Environment Variables**
   - Use strong JWT_SECRET
   - Set NODE_ENV=production
   - Use production database credentials

2. **Enable HTTPS**
   - Use reverse proxy (nginx)
   - Obtain SSL certificates

3. **Database Backups**
   - Set up automated PostgreSQL backups
   - Use managed database service

4. **Monitoring**
   - Add application monitoring
   - Set up error tracking

## 📝 License

This is an MVP project for demonstration purposes.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker logs
3. Verify environment variables

---

**Built with ❤️ for modern security operations**
