import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { 
  createWithdrawal, 
  updateWithdrawal, 
  deleteWithdrawal, 
  getGroupWithdrawals,
  getMemberWithdrawals,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} from '../controllers/withdrawalController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Create withdrawal
// @route   POST /api/withdrawals
// @access  Private
router.post('/', [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required'),
  body('groupId')
    .notEmpty()
    .withMessage('Group ID is required'),
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020 })
    .withMessage('Year must be valid'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
], createWithdrawal)

// @desc    Update withdrawal
// @route   PUT /api/withdrawals/:id
// @access  Private
router.put('/:id', [
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], updateWithdrawal)

// @desc    Delete withdrawal
// @route   DELETE /api/withdrawals/:id
// @access  Private
router.delete('/:id', deleteWithdrawal)

// @desc    Get all withdrawals for a group
// @route   GET /api/groups/:groupId/withdrawals
// @access  Private
router.get('/groups/:groupId', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED'])
], getGroupWithdrawals)

// @desc    Get all withdrawals for a member
// @route   GET /api/members/:memberId/withdrawals
// @access  Private
router.get('/members/:memberId', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED'])
], getMemberWithdrawals)

// @desc    Get all pending withdrawals for admin
// @route   GET /api/withdrawals/pending
// @access  Private
router.get('/pending', getPendingWithdrawals)

// @desc    Approve withdrawal
// @route   PUT /api/withdrawals/:id/approve
// @access  Private
router.put('/:id/approve', [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], approveWithdrawal)

// @desc    Reject withdrawal
// @route   PUT /api/withdrawals/:id/reject
// @access  Private
router.put('/:id/reject', [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], rejectWithdrawal)

export default router