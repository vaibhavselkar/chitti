import { Request, Response } from 'express'
import { Payment } from '../models/Payment'
import { ChittiGroup } from '../models/ChittiGroup'
import { Member } from '../models/Member'
import { validationResult } from 'express-validator'

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { memberId, groupId, month, year, amount, status, paymentMethod, transactionId, notes } = req.body

    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    const existingPayment = await Payment.findOne({
      memberId,
      groupId,
      month,
      year,
      adminId: req.user._id.toString()
    })

    if (existingPayment) {
      res.status(400).json({ message: 'Payment already exists for this month and year' })
      return
    }

    const payment = new Payment({
      memberId,
      groupId,
      adminId: req.user._id.toString(),
      month,
      year,
      amount: amount || group.monthlyAmount,   // FIX: was monthlyContribution
      status: status || 'PAID',
      paymentMethod: paymentMethod || 'CASH',
      transactionId,
      notes
    })

    await payment.save()

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    })
  } catch (error: any) {
    console.error('Create payment error:', error)
    if (error.code === 11000) {
      res.status(400).json({ message: 'Payment already exists for this member, month, and year' })
      return
    }
    res.status(500).json({ message: 'Server error while creating payment' })
  }
}

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
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
    const { status, paymentMethod, amount, transactionId, notes } = req.body

    const payment = await Payment.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' })
      return
    }

    if (status) payment.status = status
    if (paymentMethod) payment.paymentMethod = paymentMethod
    if (amount) payment.amount = amount
    if (transactionId !== undefined) payment.transactionId = transactionId
    if (notes !== undefined) payment.notes = notes

    await payment.save()

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    })
  } catch (error: any) {
    console.error('Update payment error:', error)
    res.status(500).json({ message: 'Server error while updating payment' })
  }
}

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { id } = req.params

    const payment = await Payment.findOne({
      _id: id,
      adminId: req.user._id.toString()
    })

    if (!payment) {
      res.status(404).json({ message: 'Payment not found' })
      return
    }

    await Payment.deleteOne({ _id: payment._id })

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete payment error:', error)
    res.status(500).json({ message: 'Server error while deleting payment' })
  }
}

// @desc    Get all payments for a group
// @route   GET /api/groups/:groupId/payments
// @access  Private
export const getGroupPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId } = req.params
    const { month, year, status } = req.query

    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    const query: any = {
      groupId,
      adminId: req.user._id.toString()
    }

    if (month) query.month = parseInt(month as string)
    if (year) query.year = parseInt(year as string)
    if (status) query.status = status

    const payments = await Payment.find(query)
      .populate('memberId', 'name phoneNumber')
      .sort({ year: -1, month: -1, createdAt: -1 })

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      paidPayments: payments.filter(p => p.status === 'PAID').length,
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      overduePayments: payments.filter(p => p.status === 'OVERDUE').length
    }

    res.json({
      success: true,
      data: payments,
      summary,
      groupInfo: {
        name: group.name,
        monthlyContribution: group.monthlyAmount   // FIX: was monthlyContribution
      }
    })
  } catch (error: any) {
    console.error('Get group payments error:', error)
    res.status(500).json({ message: 'Server error while fetching group payments' })
  }
}

// @desc    Get all payments for a member
// @route   GET /api/members/:memberId/payments
// @access  Private
export const getMemberPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { memberId } = req.params
    const { month, year, status } = req.query

    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      res.status(404).json({ message: 'Member not found' })
      return
    }

    const query: any = {
      memberId,
      adminId: req.user._id.toString()
    }

    if (month) query.month = parseInt(month as string)
    if (year) query.year = parseInt(year as string)
    if (status) query.status = status

    const payments = await Payment.find(query)
      .populate('groupId', 'name monthlyAmount')
      .sort({ year: -1, month: -1, createdAt: -1 })

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      paidPayments: payments.filter(p => p.status === 'PAID').length,
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      overduePayments: payments.filter(p => p.status === 'OVERDUE').length
    }

    res.json({
      success: true,
      data: payments,
      summary,
      memberInfo: {
        name: member.name,
        phoneNumber: member.phoneNumber
      }
    })
  } catch (error: any) {
    console.error('Get member payments error:', error)
    res.status(500).json({ message: 'Server error while fetching member payments' })
  }
}

// @desc    Get payment matrix for a group
// @route   GET /api/groups/:groupId/payments/matrix
// @access  Private
export const getPaymentMatrix = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { groupId } = req.params
    const { month, year } = req.query

    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' })
      return
    }

    const targetMonth = parseInt(month as string)
    const targetYear = parseInt(year as string)

    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      res.status(404).json({ message: 'Group not found' })
      return
    }

    const groupMembers = await Payment.aggregate([
      {
        $match: {
          groupId,
          adminId: req.user._id.toString(),
          month: targetMonth,
          year: targetYear
        }
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member'
        }
      },
      { $unwind: '$member' },
      {
        $group: {
          _id: '$memberId',
          member: { $first: '$member' },
          payment: { $first: '$$ROOT' }
        }
      }
    ])

    const allGroupMembers = await Payment.aggregate([
      {
        $match: {
          groupId,
          adminId: req.user._id.toString()
        }
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member'
        }
      },
      { $unwind: '$member' },
      {
        $group: {
          _id: '$memberId',
          member: { $first: '$member' }
        }
      }
    ])

    const matrixData = allGroupMembers.map(groupMember => {
      const payment = groupMembers.find(pm => pm._id === groupMember._id)
      return {
        memberId: groupMember.member._id,
        memberName: groupMember.member.name,
        phoneNumber: groupMember.member.phoneNumber,
        payment: payment ? {
          _id: payment.payment._id,
          amount: payment.payment.amount,
          status: payment.payment.status,
          paymentMethod: payment.payment.paymentMethod,
          paymentDate: payment.payment.paymentDate,
          transactionId: payment.payment.transactionId,
          notes: payment.payment.notes
        } : null
      }
    })

    res.json({
      success: true,
      data: matrixData,
      month: targetMonth,
      year: targetYear,
      groupInfo: {
        name: group.name,
        monthlyContribution: group.monthlyAmount,   // FIX: was monthlyContribution
        totalMembers: matrixData.length
      }
    })
  } catch (error: any) {
    console.error('Get payment matrix error:', error)
    res.status(500).json({ message: 'Server error while fetching payment matrix' })
  }
}

// @desc    Bulk update payments
// @route   PUT /api/payments/bulk
// @access  Private
export const bulkUpdatePayments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' })
      return
    }

    const { paymentIds, status } = req.body

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      res.status(400).json({ message: 'Valid payment IDs array is required' })
      return
    }

    const result = await Payment.updateMany(
      {
        _id: { $in: paymentIds },
        adminId: req.user._id.toString()
      },
      { $set: { status } }
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} payments updated successfully`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error: any) {
    console.error('Bulk update payments error:', error)
    res.status(500).json({ message: 'Server error while bulk updating payments' })
  }
}