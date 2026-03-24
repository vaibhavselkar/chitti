import { Router } from 'express'
import { body } from 'express-validator'
import {
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupMembers,
  getMemberGroups,
  updateMemberChittiCount
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
    .withMessage('Member data must be an object if provided'),
  body('chittiCount').optional().isInt({ min: 1, max: 10 }).withMessage('Chitti count must be between 1 and 10')
], addMemberToGroup)

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private
router.delete('/:groupId/members/:memberId', removeMemberFromGroup)

// @desc    Get all members in a group
// @route   GET /api/groups/:groupId/members
// @access  Private
router.get('/:groupId/members', getGroupMembers)

// @desc    Update member chitti count in group
// @route   PUT /api/groups/:groupId/members/:memberId/chitti-count
// @access  Private
router.put('/:groupId/members/:memberId/chitti-count', [
  body('chittiCount').isInt({ min: 1, max: 10 }).withMessage('Chitti count must be between 1 and 10')
], updateMemberChittiCount)

// @desc    Get all groups for a member
// @route   GET /api/members/:memberId/groups
// @access  Private
router.get('/members/:memberId/groups', getMemberGroups)

export default router
