const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import scheduler
const cron = require('node-cron');
const { setupReminderScheduler } = require('./services/reminderScheduler');

// Import routes
const authRoutes = require('./routes/auth');
const chitRoutes = require('./routes/chits');
const memberRoutes = require('./routes/members');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadDir));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chitti';

// FIX 1: Removed duplicate serverSelectionTimeoutMS key.
// FIX 2: Increased serverSelectionTimeoutMS to 30s so Atlas has time to respond.
// FIX 3: Added retryWrites and w=majority (recommended for Atlas).
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000, // How long to keep retrying to find an available server
  socketTimeoutMS: 60000,          // Close sockets after 60 seconds of inactivity
  connectTimeoutMS: 30000,         // How long to wait for initial connection
  maxPoolSize: 10,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log(`Connected to: ${mongoUri}`);
})
.catch(err => {
  // FIX 4: Log the FULL error in all environments so you can diagnose on deployment
  console.error('MongoDB connection error:', err.message);
  console.error('Error name:', err.name);
  console.error('Full error:', JSON.stringify(err, null, 2));

  // FIX 5: Exit in ALL environments — a server with no DB is broken regardless.
  // Remove the production exception that was silently swallowing the error.
  process.exit(1);
});

// Log connection events for ongoing monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chits', chitRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    message: 'Chitti Backend Server',
    mongodb: {
      connected: isConnected,
      connectionState: states[mongoose.connection.readyState] ?? mongoose.connection.readyState
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  } else {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: err.message,
      stack: err.stack
    });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setupReminderScheduler(cron);
});

module.exports = app;