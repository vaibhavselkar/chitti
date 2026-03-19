import { Router } from 'express'
import { body } from 'express-validator'
import { 
  getMembers, 
  getMember, 
  createMember, 
  updateMember, 
  deleteMember 
} from '../controllers/memberController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Get all members for admin
// @route   GET /api/members
// @access  Private
router.get('/', getMembers)

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
router.get('/:id', getMember)

// @desc    Create new member
// @route   POST /api/members
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Member name must be between 2 and 50 characters'),
  body('phoneNumber')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian phone number')
], createMember)

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Member name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian phone number')
], updateMember)

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private
router.delete('/:id', deleteMember)

export default router