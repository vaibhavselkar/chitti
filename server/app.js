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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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

// Enhanced connection with better error handling
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  socketTimeoutMS: 45000, // 45 second timeout
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log(`Connected to: ${mongoUri}`);
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Connection string used:', mongoUri);
  
  // Don't exit process in production, just log the error
  if (process.env.NODE_ENV === 'production') {
    console.log('Continuing without database connection for now...');
  } else {
    process.exit(1);
  }
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  // Don't expose error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: err.message,
      stack: err.stack
    });
  }
});

// Note: Frontend is deployed separately, so we don't serve it from the backend
// This route should not be triggered in production since frontend handles its own routing
app.get('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setupReminderScheduler(cron);
});

module.exports = app;