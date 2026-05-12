const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const patrolRoutes = require('./routes/patrol.routes');
const supervisorRoutes = require('./routes/supervisor.routes');
const siteRoutes = require('./routes/site.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// CORS configuration for production
const normalizeOrigin = (origin) => origin?.replace(/\/$/, '');

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://frontend-hrqz.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
]
  .filter(Boolean)
  .flatMap((origin) => origin.split(','))
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests such as health checks and server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

console.log('Allowed CORS origins:', allowedOrigins.join(', '));

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/patrol', patrolRoutes);
app.use('/supervisor', supervisorRoutes);
app.use('/sites', siteRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
