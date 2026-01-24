@echo off
echo ============================================
echo Security Patrol Tracking System - Quick Start
echo ============================================
echo.

echo Step 1: Starting Docker containers...
docker-compose up -d

echo.
echo Waiting for services to initialize (30 seconds)...
timeout /t 30 /nobreak

echo.
echo Step 2: Running database migrations...
docker exec -it security-patrol-backend npx prisma migrate deploy

echo.
echo Step 3: Seeding demo data...
docker exec -it security-patrol-backend npm run prisma:seed

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Demo Credentials:
echo   Guard: guard1@security.com / password123
echo   Supervisor: supervisor@security.com / password123
echo   Client: client@company.com / password123
echo.
echo Press any key to view logs...
pause
docker-compose logs -f
