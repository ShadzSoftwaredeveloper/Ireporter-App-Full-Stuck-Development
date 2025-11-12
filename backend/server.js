import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { verifyEmailConnection } from './config/email.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'iReporter API is running!' });
});

// Start server
const startServer = async () => {
  const dbConnected = await testConnection();
  const emailConnected = await verifyEmailConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: ${dbConnected ? 'Connected ✅' : 'Not Connected ❌'}`);
    console.log(`📧 Email: ${emailConnected ? 'Connected ✅' : 'Not Connected ❌'}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  });
};

startServer();