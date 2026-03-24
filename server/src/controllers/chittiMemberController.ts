import { Request, Response } from 'express'
import { ChittiMember } from '../models/ChittiMember'
import { Member } from '../models/Member'
import { ChittiGroup } from '../models/ChittiGroup'
import { validationResult } from 'express-validator'

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members
// @access  Private
export const addMemberToGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { memberId, chittiCount: rawChittiCount } = req.body
    const { groupId } = req.params
    const chittiCount = Math.max(1, parseInt(rawChittiCount) || 1)

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    // Validate member exists and belongs to admin
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    // Check if member is already in the group
    const existingMember = await ChittiMember.findOne({
      memberId,
      groupId,
      adminId: req.user._id.toString()
    })

    // Get all group members to compute used slots
    const allGroupMembers = await ChittiMember.find({ groupId, adminId: req.user._id.toString() })

    // Used slots excluding current member (if updating)
    const usedSlots = allGroupMembers
      .filter(m => !existingMember || m._id.toString() !== existingMember._id.toString())
      .reduce((sum, m) => sum + (m.chittiCount || 1), 0)

    const newTotalSlots = usedSlots + (existingMember ? existingMember.chittiCount + chittiCount : chittiCount)

    if (newTotalSlots > group.totalMembers) {
      const available = group.totalMembers - usedSlots - (existingMember?.chittiCount || 0)
      res.status(400).json({
        message: `Not enough slots. Only ${available} slot(s) available`
      })
      return
    }

    if (existingMember) {
      existingMember.chittiCount = existingMember.chittiCount + chittiCount
      await existingMember.save()

      // Update group status
      const totalUsed = usedSlots + existingMember.chittiCount
      if (totalUsed >= group.totalMembers && group.status !== 'FULL') {
        group.status = 'FULL'
        await group.save()
      }

      res.json({
        success: true,
        message: `Chitti count updated to ${existingMember.chittiCount}`,
        data: { ...existingMember.toObject(), member: { _id: member._id, name: member.name, phoneNumber: member.phoneNumber } }
      })
      return
    }

    // Create new ChittiMember
    const chittiMember = new ChittiMember({
      memberId,
      groupId,
      adminId: req.user._id.toString(),
      chittiCount
    })

    await chittiMember.save()

    // Update group status if it's now full
    const totalUsedAfter = usedSlots + chittiCount
    if (totalUsedAfter >= group.totalMembers && group.status !== 'FULL') {
      group.status = 'FULL'
      await group.save()
    }

    res.status(201).json({
      success: true,
      message: 'Member added to group successfully',
      data: {
        ...chittiMember.toObject(),
        member: {
          _id: member._id,
          name: member.name,
          phoneNumber: member.phoneNumber
        }
      }
    })
  } catch (error: any) {
    console.error('Add member to group error:', error)

    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({ message: 'Member is already in this group' })
      return
    }

    res.status(500).json({ message: 'Server error while adding member to group' })
  }
}

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private
export const removeMemberFromGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId, memberId } = req.params

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    // Validate member exists and belongs to admin
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    // Remove member from group
    const result = await ChittiMember.deleteOne({
      memberId,
      groupId,
      adminId: req.user._id.toString()
    })

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Member not found in this group' })
      return
    }

    // Update group status using sum of chittiCounts
    const remainingMembers = await ChittiMember.find({ groupId, adminId: req.user._id.toString() })
    const totalUsed = remainingMembers.reduce((sum, m) => sum + (m.chittiCount || 1), 0)

    if (totalUsed < group.totalMembers && group.status === 'FULL') {
      group.status = 'OPEN'
      await group.save()
    }

    res.json({
      success: true,
      message: 'Member removed from group successfully'
    })
  } catch (error: any) {
    console.error('Remove member from group error:', error)
    res.status(500).json({ message: 'Server error while removing member from group' })
  }
}

// @desc    Get all members in a group
// @route   GET /api/groups/:groupId/members
// @access  Private
export const getGroupMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId } = req.params

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    // Get all members in the group
    const chittiMembers = await ChittiMember.find({
      groupId,
      adminId: req.user._id.toString()
    }).populate('memberId', 'name phoneNumber')

    const members = chittiMembers.map(cm => {
      const memberDoc = cm.memberId as any
      return {
        _id: cm._id,
        memberId: memberDoc._id,
        name: memberDoc.name,
        phoneNumber: memberDoc.phoneNumber,
        chittiCount: cm.chittiCount || 1,
        joinedAt: cm.joinedAt
      }
    })

    const totalChittis = members.reduce((sum, m) => sum + (m.chittiCount || 1), 0)

    res.json({
      success: true,
      data: members,
      count: members.length,
      groupInfo: {
        name: group.name,
        totalMembers: group.totalMembers,
        currentMembers: totalChittis,
        status: group.status
      }
    })
  } catch (error: any) {
    console.error('Get group members error:', error)
    res.status(500).json({ message: 'Server error while fetching group members' })
  }
}

// @desc    Get all groups for a member
// @route   GET /api/members/:memberId/groups
// @access  Private
export const getMemberGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { memberId } = req.params

    // Validate member exists and belongs to admin
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    // Get all groups for the member
    const chittiMembers = await ChittiMember.find({
      memberId,
      adminId: req.user._id.toString()
    }).populate('groupId', 'name totalMembers status startDate')

    const groups = chittiMembers.map(cm => {
      const groupDoc = cm.groupId as any
      return {
        _id: cm._id,
        groupId: groupDoc._id,
        name: groupDoc.name,
        totalMembers: groupDoc.totalMembers,
        status: groupDoc.status,
        startDate: groupDoc.startDate,
        joinedAt: cm.joinedAt
      }
    })

    res.json({
      success: true,
      data: groups,
      count: groups.length,
      memberInfo: {
        name: member.name,
        phoneNumber: member.phoneNumber
      }
    })
  } catch (error: any) {
    console.error('Get member groups error:', error)
    res.status(500).json({ message: 'Server error while fetching member groups' })
  }
}

// @desc    Update member chitti count in group
// @route   PUT /api/groups/:groupId/members/:memberId/chitti-count
// @access  Private
export const updateMemberChittiCount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId, memberId } = req.params
    const { chittiCount } = req.body

    const group = await ChittiGroup.findOne({ _id: groupId, adminId: req.user._id.toString() })
    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    const chittiMember = await ChittiMember.findOne({ memberId, groupId, adminId: req.user._id.toString() })
    if (!chittiMember) {
      res.status(404).json({ message: 'Member not found in this group' })
      return
    }

    // Check capacity: sum of all others + new chittiCount
    const allMembers = await ChittiMember.find({ groupId, adminId: req.user._id.toString() })
    const otherSlots = allMembers
      .filter(m => m._id.toString() !== chittiMember._id.toString())
      .reduce((sum, m) => sum + (m.chittiCount || 1), 0)

    if (otherSlots + chittiCount > group.totalMembers) {
      res.status(400).json({ message: `Only ${group.totalMembers - otherSlots} slot(s) available` })
      return
    }

    chittiMember.chittiCount = chittiCount
    await chittiMember.save()

    // Update group status
    const totalUsed = otherSlots + chittiCount
    if (totalUsed >= group.totalMembers && group.status !== 'FULL') {
      group.status = 'FULL'
      await group.save()
    } else if (totalUsed < group.totalMembers && group.status === 'FULL') {
      group.status = 'OPEN'
      await group.save()
    }

    res.json({ success: true, message: 'Chitti count updated', data: chittiMember })
  } catch (error: any) {
    console.error('Update chitti count error:', error)
    res.status(500).json({ message: 'Server error while updating chitti count' })
  }
}
