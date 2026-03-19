import { Router } from 'express'
import { body } from 'express-validator'
import { 
  addMemberToGroup, 
  removeMemberFromGroup, 
  getGroupMembers,
  getMemberGroups
} from '../controllers/chittiMemberController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members
// @access  Private
router.post('/:groupId/members', [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required'),
  body('memberData')
    .optional()
    .isObject()
    .withMessage('Member data must be an object if provided')
], addMemberToGroup)

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private
router.delete('/:groupId/members/:memberId', removeMemberFromGroup)

// @desc    Get all members in a group
// @route   GET /api/groups/:groupId/members
// @access  Private
router.get('/:groupId/members', getGroupMembers)

// @desc    Get all groups for a member
// @route   GET /api/members/:memberId/groups
// @access  Private
router.get('/members/:memberId/groups', getMemberGroups)

export default router