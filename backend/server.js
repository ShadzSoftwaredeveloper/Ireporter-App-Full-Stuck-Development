const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database (mysql2) initializer
const { initSchema } = require('./database/init');

// Import routes
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const userProfileRoutes = require('./routes/user.profile.routes');
const uploadRoutes = require('./routes/upload.routes');

// Initialize Express app
const app = express();

// Middleware
// Configure Helmet differently in development so static media can be loaded from the frontend origin.
const helmetOptions = process.env.NODE_ENV === 'development'
  ? { crossOriginResourcePolicy: { policy: 'cross-origin' } }
  : {};
app.use(helmet(helmetOptions)); // Security headers
// During development allow any origin to avoid CORS mismatches from env vars.
// In production rely on FRONTEND_URL to restrict origins.
const corsOrigin = process.env.NODE_ENV === 'development'
  ? true
  : (process.env.FRONTEND_URL || 'http://localhost:3000');

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(morgan('dev')); // Logging
// Parse JSON and URL-encoded bodies; increase limits to allow base64 image payloads
// (profile picture uploads are sent as base64 in the request body).
const BODY_PARSER_LIMIT = process.env.BODY_PARSER_LIMIT || '100mb';
app.use(express.json({ limit: BODY_PARSER_LIMIT })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: BODY_PARSER_LIMIT })); // Parse URL-encoded bodies

// Static files for uploads
// Ensure uploaded media can be requested from the frontend during development
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (process.env.NODE_ENV === 'development') {
      // Allow frontend dev server to load images/videos from backend uploads
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    }
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userProfileRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Incident Reporting API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      incidents: '/api/incidents',
      notifications: '/api/notifications',
      users: '/api/users',
      uploads: '/api/upload'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Ensure database schema (idempotent)
    await initSchema();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;