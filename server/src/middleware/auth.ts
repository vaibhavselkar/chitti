import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../models/User'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

interface JwtPayload {
  userId: string
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Access denied. No token provided.' })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' })
      return
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -googleId')
    
    if (!user) {
      res.status(401).json({ message: 'Token is not valid.' })
      return
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ message: 'Token is not valid.' })
  }
}

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)
    
    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    const user = await User.findById(decoded.userId).select('-password -googleId')
    
    if (user) {
      req.user = user
    }
    
    next()
  } catch (error) {
    next()
  }
}