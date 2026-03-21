import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { 
  createPayment, 
  updatePayment, 
  deletePayment, 
  getGroupPayments,
  getMemberPayments,
  getPaymentMatrix,
  bulkUpdatePayments
} from '../controllers/paymentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Create payment
// @route   POST /api/payments
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
  body('status')
    .optional()
    .isIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
    .withMessage('Status must be PAID, PARTIAL, PENDING, or OVERDUE'),
  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'])
    .withMessage('Payment method must be valid'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be positive')
], createPayment)

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
router.put('/:id', [
  body('status')
    .optional()
    .isIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
    .withMessage('Status must be PAID, PARTIAL, PENDING, or OVERDUE'),
  body('paymentMethod')
    .optional()
    .isIn(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'])
    .withMessage('Payment method must be valid'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be positive')
], updatePayment)

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
router.delete('/:id', deletePayment)

// @desc    Get all payments for a group
// @route   GET /api/groups/:groupId/payments
// @access  Private
router.get('/groups/:groupId', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('status').optional().isIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
], getGroupPayments)

// @desc    Get all payments for a member
// @route   GET /api/members/:memberId/payments
// @access  Private
router.get('/members/:memberId', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('status').optional().isIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
], getMemberPayments)

// @desc    Get payment matrix for a group
// @route   GET /api/groups/:groupId/payments/matrix
// @access  Private
router.get('/:groupId/matrix', [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month is required'),
  query('year').isInt({ min: 2020 }).withMessage('Year is required')
], getPaymentMatrix)

// @desc    Bulk update payments
// @route   PUT /api/payments/bulk
// @access  Private
router.put('/bulk', [
  body('paymentIds')
    .isArray({ min: 1 })
    .withMessage('Payment IDs array is required'),
  body('status')
    .isIn(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])
    .withMessage('Status must be PAID, PARTIAL, PENDING, or OVERDUE')
], bulkUpdatePayments)

export default router