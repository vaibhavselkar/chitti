import { Request, Response } from 'express'
import { Withdrawal } from '../models/Withdrawal'
import { ChittiGroup } from '../models/ChittiGroup'
import { Member } from '../models/Member'
import { validationResult } from 'express-validator'

// @desc    Create withdrawal
// @route   POST /api/withdrawals
// @access  Private
export const createWithdrawal = async (req: Request, res: Response): Promise<void> => {
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

    const { memberId, groupId, month, year, amount, reason, notes } = req.body

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

    // Check if withdrawal already exists for this member, month, and year
    const existingWithdrawal = await Withdrawal.findOne({
      memberId,
      groupId,
      month,
      year,
      adminId: req.user._id.toString()
    })

    if (existingWithdrawal) {
      res.status(400).json({ message: 'Withdrawal already exists for this month and year' })
      return
    }

    // Create withdrawal
    const withdrawal = new Withdrawal({
      memberId,
      groupId,
      adminId: req.user._id.toString(),
      month,
      year,
      amount,
      reason,
      notes
    })

    await withdrawal.save()

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawal
    })
  } catch (error: any) {
    console.error('Create withdrawal error:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({ message: 'Withdrawal already exists for this member, month, and year' })
      return
    }

    res.status(500).json({ message: 'Server error while creating withdrawal' })
  }
}

// @desc    Update withdrawal
// @route   PUT /api/withdrawals/:id
// @access  Private
export const updateWithdrawal = async (req: Request, res: Response): Promise<void> => {
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

    const { id } = req.params
    const { amount, reason, notes } = req.body

    // Find and validate withdrawal belongs to admin
    const withdrawal = await Withdrawal.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!withdrawal) {
      res.status(404).json({ message: 'Withdrawal not found' })
      return
    }

    // Cannot update if already approved or rejected
    if (withdrawal.status !== 'PENDING') {
      res.status(400).json({ message: 'Cannot update withdrawal that is already processed' })
      return
    }

    // Update fields
    if (amount) withdrawal.amount = amount
    if (reason) withdrawal.reason = reason
    if (notes !== undefined) withdrawal.notes = notes

    await withdrawal.save()

    res.json({
      success: true,
      message: 'Withdrawal updated successfully',
      data: withdrawal
    })
  } catch (error: any) {
    console.error('Update withdrawal error:', error)
    res.status(500).json({ message: 'Server error while updating withdrawal' })
  }
}

// @desc    Delete withdrawal
// @route   DELETE /api/withdrawals/:id
// @access  Private
export const deleteWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { id } = req.params

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!withdrawal) {
      res.status(404).json({ message: 'Withdrawal not found' })
      return
    }

    // Cannot delete if already approved or rejected
    if (withdrawal.status !== 'PENDING') {
      res.status(400).json({ message: 'Cannot delete withdrawal that is already processed' })
      return
    }

    await Withdrawal.deleteOne({ _id: withdrawal._id })

    res.json({
      success: true,
      message: 'Withdrawal deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete withdrawal error:', error)
    res.status(500).json({ message: 'Server error while deleting withdrawal' })
  }
}

// @desc    Get all withdrawals for a group
// @route   GET /api/groups/:groupId/withdrawals
// @access  Private
export const getGroupWithdrawals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId } = req.params
    const { month, year, status } = req.query

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    // Build query
    const query: any = {
      groupId,
      adminId: req.user._id.toString()
    }

    if (month) query.month = parseInt(month as string)
    if (year) query.year = parseInt(year as string)
    if (status) query.status = status

    const withdrawals = await Withdrawal.find(query)
      .populate('memberId', 'name phoneNumber')
      .sort({ year: -1, month: -1, createdAt: -1 })

    // Calculate summary
    const summary = {
      totalWithdrawals: withdrawals.length,
      totalAmount: withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'PENDING').length,
      approvedWithdrawals: withdrawals.filter(w => w.status === 'APPROVED').length,
      rejectedWithdrawals: withdrawals.filter(w => w.status === 'REJECTED').length
    }

    res.json({
      success: true,
      data: withdrawals,
      summary,
      groupInfo: {
        name: group.name
      }
    })
  } catch (error: any) {
    console.error('Get group withdrawals error:', error)
    res.status(500).json({ message: 'Server error while fetching group withdrawals' })
  }
}

// @desc    Get all withdrawals for a member
// @route   GET /api/members/:memberId/withdrawals
// @access  Private
export const getMemberWithdrawals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { memberId } = req.params
    const { month, year, status } = req.query

    // Validate member exists and belongs to admin
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    // Build query
    const query: any = {
      memberId,
      adminId: req.user._id.toString()
    }

    if (month) query.month = parseInt(month as string)
    if (year) query.year = parseInt(year as string)
    if (status) query.status = status

    const withdrawals = await Withdrawal.find(query)
      .populate('groupId', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 })

    // Calculate summary
    const summary = {
      totalWithdrawals: withdrawals.length,
      totalAmount: withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'PENDING').length,
      approvedWithdrawals: withdrawals.filter(w => w.status === 'APPROVED').length,
      rejectedWithdrawals: withdrawals.filter(w => w.status === 'REJECTED').length
    }

    res.json({
      success: true,
      data: withdrawals,
      summary,
      memberInfo: {
        name: member.name,
        phoneNumber: member.phoneNumber
      }
    })
  } catch (error: any) {
    console.error('Get member withdrawals error:', error)
    res.status(500).json({ message: 'Server error while fetching member withdrawals' })
  }
}

// @desc    Get all pending withdrawals for admin
// @route   GET /api/withdrawals/pending
// @access  Private
export const getPendingWithdrawals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const withdrawals = await Withdrawal.find({
      adminId: req.user._id.toString(),
      status: 'PENDING'
    })
      .populate('memberId', 'name phoneNumber')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: withdrawals,
      count: withdrawals.length
    })
  } catch (error: any) {
    console.error('Get pending withdrawals error:', error)
    res.status(500).json({ message: 'Server error while fetching pending withdrawals' })
  }
}

// @desc    Approve withdrawal
// @route   PUT /api/withdrawals/:id/approve
// @access  Private
export const approveWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { id } = req.params
    const { notes } = req.body

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!withdrawal) {
      res.status(404).json({ message: 'Withdrawal not found' })
      return
    }

    // Cannot approve if already processed
    if (withdrawal.status !== 'PENDING') {
      res.status(400).json({ message: 'Withdrawal has already been processed' })
      return
    }

    // Update withdrawal
    withdrawal.status = 'APPROVED'
    withdrawal.approvedBy = req.user._id.toString()
    withdrawal.approvedAt = new Date()
    if (notes !== undefined) withdrawal.notes = notes

    await withdrawal.save()

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      data: withdrawal
    })
  } catch (error: any) {
    console.error('Approve withdrawal error:', error)
    res.status(500).json({ message: 'Server error while approving withdrawal' })
  }
}

// @desc    Reject withdrawal
// @route   PUT /api/withdrawals/:id/reject
// @access  Private
export const rejectWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { id } = req.params
    const { notes } = req.body

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!withdrawal) {
      res.status(404).json({ message: 'Withdrawal not found' })
      return
    }

    // Cannot reject if already processed
    if (withdrawal.status !== 'PENDING') {
      res.status(400).json({ message: 'Withdrawal has already been processed' })
      return
    }

    // Update withdrawal
    withdrawal.status = 'REJECTED'
    withdrawal.approvedBy = req.user._id.toString()
    withdrawal.approvedAt = new Date()
    if (notes !== undefined) withdrawal.notes = notes

    await withdrawal.save()

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      data: withdrawal
    })
  } catch (error: any) {
    console.error('Reject withdrawal error:', error)
    res.status(500).json({ message: 'Server error while rejecting withdrawal' })
  }
}