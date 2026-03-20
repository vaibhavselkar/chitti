import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/authRoutes'
import chittiGroupRoutes from './routes/chittiGroupRoutes'
import memberRoutes from './routes/memberRoutes'
import chittiMemberRoutes from './routes/chittiMemberRoutes'
import paymentRoutes from './routes/paymentRoutes'
import withdrawalRoutes from './routes/withdrawalRoutes'
import pdfRoutes from './routes/pdfRoutes'
import notificationRoutes from './routes/notificationRoutes'

// Load environment variables
dotenv.config()

// Initialize app
const app = express()

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})

app.use('/api', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:3005', 'http://localhost:3000', 'https://chitti-gray.vercel.app'],
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    } as any)
    
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/groups', chittiGroupRoutes)
app.use('/api/groups', chittiMemberRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
app.use('/api/reports', pdfRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Chitti Manager API is running',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error)
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(error.status || 500).json({
    message: error.message || 'Server Error',
    ...(isDevelopment && { stack: error.stack })
  })
})

// Connect to DB and start server (local dev)
const PORT = process.env.PORT || 5000

connectDB().then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  }
}).catch((error) => {
  console.error('Failed to connect to DB:', error)
  process.exit(1)
})

// Export for Vercel serverless
export default app