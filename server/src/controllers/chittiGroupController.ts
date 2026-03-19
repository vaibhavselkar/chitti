import { Request, Response } from 'express'
import { ChittiGroup } from '../models/ChittiGroup'
import { validationResult } from 'express-validator'

// @desc    Get all Chitti groups for admin
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const groups = await ChittiGroup.find({ adminId: req.user._id.toString() })
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      data: groups,
      count: groups.length
    })
  } catch (error: any) {
    console.error('Get groups error:', error)
    res.status(500).json({ message: 'Server error while fetching groups' })
  }
}

// @desc    Get single Chitti group
// @route   GET /api/groups/:id
// @access  Private
export const getGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const group = await ChittiGroup.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    }).lean()

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    res.json({
      success: true,
      data: group
    })
  } catch (error: any) {
    console.error('Get group error:', error)
    res.status(500).json({ message: 'Server error while fetching group' })
  }
}

// @desc    Create new Chitti group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: Request, res: Response): Promise<void> => {
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

    const {
      name,
      totalMembers,
      monthlyAmount,
      totalMonths,
      collectionDay,
      startDate
    } = req.body

    // Validate start date
    const start = new Date(startDate)
    if (start < new Date()) {
      res.status(400).json({ message: 'Start date cannot be in the past' })
      return
    }

    // Create new group
    const group = new ChittiGroup({
      name,
      totalMembers,
      monthlyAmount,
      totalMonths,
      collectionDay,
      startDate: start,
      adminId: req.user._id.toString()
    })

    await group.save()

    res.status(201).json({
      success: true,
      message: 'Chitti group created successfully',
      data: group
    })
  } catch (error: any) {
    console.error('Create group error:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({ message: 'Group name already exists' })
      return
    }

    res.status(500).json({ message: 'Server error while creating group' })
  }
}

// @desc    Update Chitti group
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
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

    const {
      name,
      totalMembers,
      monthlyAmount,
      totalMonths,
      collectionDay,
      startDate,
      status
    } = req.body

    const group = await ChittiGroup.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    // Update fields
    if (name) group.name = name
    if (totalMembers) group.totalMembers = totalMembers
    if (monthlyAmount) group.monthlyAmount = monthlyAmount
    if (totalMonths) group.totalMonths = totalMonths
    if (collectionDay) group.collectionDay = collectionDay
    if (startDate) {
      const start = new Date(startDate)
      if (start < new Date()) {
        res.status(400).json({ message: 'Start date cannot be in the past' })
        return
      }
      group.startDate = start
    }
    if (status && ['OPEN', 'FULL'].includes(status)) {
      group.status = status
    }

    await group.save()

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    })
  } catch (error: any) {
    console.error('Update group error:', error)
    
    if (error.code === 11000) {
      res.status(400).json({ message: 'Group name already exists' })
      return
    }

    res.status(500).json({ message: 'Server error while updating group' })
  }
}

// @desc    Delete Chitti group
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const group = await ChittiGroup.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    await ChittiGroup.deleteOne({ _id: group._id })

    res.json({
      success: true,
      message: 'Group deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete group error:', error)
    res.status(500).json({ message: 'Server error while deleting group' })
  }
}