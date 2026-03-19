import { Request, Response } from 'express'
import { Member } from '../models/Member'
import { validationResult } from 'express-validator'

// @desc    Get all members for admin
// @route   GET /api/members
// @access  Private
export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const members = await Member.find({ adminId: req.user._id.toString() })
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      data: members,
      count: members.length
    })
  } catch (error: any) {
    console.error('Get members error:', error)
    res.status(500).json({ message: 'Server error while fetching members' })
  }
}

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
export const getMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const member = await Member.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    }).lean()

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    res.json({
      success: true,
      data: member
    })
  } catch (error: any) {
    console.error('Get member error:', error)
    res.status(500).json({ message: 'Server error while fetching member' })
  }
}

// @desc    Create new member
// @route   POST /api/members
// @access  Private
export const createMember = async (req: Request, res: Response): Promise<void> => {
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

    const { name, phoneNumber } = req.body

    // Create new member
    const member = new Member({
      name,
      phoneNumber,
      adminId: req.user._id.toString()
    })

    await member.save()

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member
    })
  } catch (error: any) {
    console.error('Create member error:', error)
    
    // Handle duplicate key error (phone number already exists for this admin)
    if (error.code === 11000) {
      res.status(400).json({ message: 'Member with this phone number already exists' })
      return
    }

    res.status(500).json({ message: 'Server error while creating member' })
  }
}

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
export const updateMember = async (req: Request, res: Response): Promise<void> => {
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

    const { name, phoneNumber } = req.body

    const member = await Member.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    // Update fields
    if (name) member.name = name
    if (phoneNumber) {
      // Check if phone number is already taken by another member for this admin
      const existingPhone = await Member.findOne({ 
        phoneNumber, 
        _id: { $ne: member._id },
        adminId: req.user._id.toString()
      })
      if (existingPhone) {
        res.status(400).json({ message: 'Member with this phone number already exists' })
        return
      }
      member.phoneNumber = phoneNumber
    }

    await member.save()

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member
    })
  } catch (error: any) {
    console.error('Update member error:', error)
    
    if (error.code === 11000) {
      res.status(400).json({ message: 'Member with this phone number already exists' })
      return
    }

    res.status(500).json({ message: 'Server error while updating member' })
  }
}

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private
export const deleteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const member = await Member.findOne({
      _id: req.params.id,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    await Member.deleteOne({ _id: member._id })

    res.json({
      success: true,
      message: 'Member deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete member error:', error)
    res.status(500).json({ message: 'Server error while deleting member' })
  }
}