const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('../../backend/routes/auth');
const fileRoutes = require('../../backend/routes/files');

// Import database
const { initializeDatabase } = require('../../backend/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CloudBasedX API is running' });
});

// Export the serverless function
module.exports.handler = serverless(app); 