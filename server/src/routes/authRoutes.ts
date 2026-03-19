import { Router } from 'express'
import { body } from 'express-validator'
import { 
  signup, 
  login, 
  getMe, 
  logout, 
  updateProfile 
} from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phoneNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number')
], signup)

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login)

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, getMe)

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, logout)

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authMiddleware, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number')
], updateProfile)

export default router