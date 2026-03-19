import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User, IUser } from '../models/User'
import { validationResult } from 'express-validator'

// Generate JWT token
const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET!, options)
}

// Set HTTP-only cookie
const setAuthCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { name, email, password, phoneNumber } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' })
      return
    }

    const existingPhone = await User.findOne({ phoneNumber })
    if (existingPhone) {
      res.status(400).json({ message: 'User already exists with this phone number' })
      return
    }

    const user = new User({ name, email, password, phoneNumber })
    await user.save()

    const token = generateToken(user._id.toString())
    setAuthCookie(res, token)

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken(user._id.toString())
    setAuthCookie(res, token)

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }
    res.json({ user: req.user })
  } catch (error: any) {
    console.error('Get me error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    res.json({ message: 'Logged out successfully' })
  } catch (error: any) {
    console.error('Logout error:', error)
    res.status(500).json({ message: 'Server error during logout' })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { name, phoneNumber } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (name) user.name = name
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber, _id: { $ne: user._id } })
      if (existingPhone) {
        res.status(400).json({ message: 'Phone number already in use' })
        return
      }
      user.phoneNumber = phoneNumber
    }

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error updating profile' })
  }
}