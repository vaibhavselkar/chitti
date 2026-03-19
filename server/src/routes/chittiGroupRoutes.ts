import { Router } from 'express'
import { body } from 'express-validator'
import { 
  getGroups, 
  getGroup, 
  createGroup, 
  updateGroup, 
  deleteGroup 
} from '../controllers/chittiGroupController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Get all Chitti groups
// @route   GET /api/groups
// @access  Private
router.get('/', getGroups)

// @desc    Get single Chitti group
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', getGroup)

// @desc    Create new Chitti group
// @route   POST /api/groups
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),
  body('totalMembers')
    .isInt({ min: 3, max: 50 })
    .withMessage('Total members must be between 3 and 50'),
  body('monthlyAmount')
    .isInt({ min: 100 })
    .withMessage('Monthly amount must be at least ₹100'),
  body('totalMonths')
    .isInt({ min: 6, max: 60 })
    .withMessage('Total months must be between 6 and 60'),
  body('collectionDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Collection day must be between 1 and 31'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
], createGroup)

// @desc    Update Chitti group
// @route   PUT /api/groups/:id
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),
  body('totalMembers')
    .optional()
    .isInt({ min: 3, max: 50 })
    .withMessage('Total members must be between 3 and 50'),
  body('monthlyAmount')
    .optional()
    .isInt({ min: 100 })
    .withMessage('Monthly amount must be at least ₹100'),
  body('totalMonths')
    .optional()
    .isInt({ min: 6, max: 60 })
    .withMessage('Total months must be between 6 and 60'),
  body('collectionDay')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Collection day must be between 1 and 31'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('status')
    .optional()
    .isIn(['OPEN', 'FULL'])
    .withMessage('Status must be either OPEN or FULL')
], updateGroup)

// @desc    Delete Chitti group
// @route   DELETE /api/groups/:id
// @access  Private
router.delete('/:id', deleteGroup)

export default router