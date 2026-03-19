import { Router } from 'express'
import { param, query } from 'express-validator'
import { 
  generateGroupReport, 
  generatePaymentReceipt, 
  generateWithdrawalReceipt 
} from '../utils/pdfGenerator'
import { ChittiGroup } from '../models/ChittiGroup'
import { ChittiMember } from '../models/ChittiMember'
import { Member } from '../models/Member'
import { Payment } from '../models/Payment'
import { Withdrawal } from '../models/Withdrawal'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Generate group report PDF
// @route   GET /api/reports/groups/:groupId/pdf
// @access  Private
router.get('/groups/:groupId/pdf', [
  param('groupId').notEmpty().withMessage('Group ID is required')
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { groupId } = req.params
    const { month, year } = req.query

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Get group members (only members in this specific group)
    const chittiMembers = await ChittiMember.find({
      groupId,
      adminId: req.user._id.toString()
    }).populate('memberId', 'name phoneNumber createdAt status')
    const members = chittiMembers.map(cm => (cm.memberId as any))

    // Get payments for the group
    const paymentQuery: any = {
      groupId,
      adminId: req.user._id.toString()
    }

    if (month) paymentQuery.month = parseInt(month as string)
    if (year) paymentQuery.year = parseInt(year as string)

    const payments = await Payment.find(paymentQuery)
      .populate('memberId', 'name phoneNumber')
      .sort({ createdAt: -1 })

    // Get withdrawals for the group
    const withdrawalQuery: any = {
      groupId,
      adminId: req.user._id.toString()
    }

    if (month) withdrawalQuery.month = parseInt(month as string)
    if (year) withdrawalQuery.year = parseInt(year as string)

    const withdrawals = await Withdrawal.find(withdrawalQuery)
      .populate('memberId', 'name phoneNumber')
      .sort({ createdAt: -1 })

    // Calculate summary over full dataset (not a limited slice)
    const summary = {
      totalMembers: members.length,
      totalPayments: payments.length,
      totalAmountCollected: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalWithdrawals: withdrawals.length,
      totalAmountWithdrawn: withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      pendingWithdrawals: withdrawals.filter(w => w.status === 'PENDING').length
    }

    // Prepare data for PDF
    const reportData = {
      group: {
        ...group.toObject(),
        adminName: req.user.name
      },
      members: members.map(m => m.toObject()),
      payments: payments.map(p => ({
        ...p.toObject(),
        memberName: (p.memberId as any)?.name || 'Unknown',
        phoneNumber: (p.memberId as any)?.phoneNumber || 'N/A'
      })),
      withdrawals: withdrawals.map(w => ({
        ...w.toObject(),
        memberName: (w.memberId as any)?.name || 'Unknown',
        phoneNumber: (w.memberId as any)?.phoneNumber || 'N/A'
      })),
      summary
    }

    // Generate PDF
    const pdfBuffer = await generateGroupReport(reportData)

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="group-report-${group.name}-${new Date().toISOString()}.pdf"`)

    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Generate group report error:', error)
    res.status(500).json({ message: 'Server error while generating group report' })
  }
})

// @desc    Generate payment receipt PDF
// @route   GET /api/reports/payments/:paymentId/receipt
// @access  Private
router.get('/payments/:paymentId/receipt', [
  param('paymentId').notEmpty().withMessage('Payment ID is required')
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { paymentId } = req.params

    // Get payment details
    const payment = await Payment.findOne({
      _id: paymentId,
      adminId: req.user._id.toString()
    }).populate('memberId', 'name phoneNumber').populate('groupId', 'name')

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    // Prepare receipt data
    const receiptData = {
      receiptNumber: `PAY-${payment._id.toString().slice(-6).toUpperCase()}`,
      memberName: (payment.memberId as any)?.name || 'Unknown',
      phoneNumber: (payment.memberId as any)?.phoneNumber || 'N/A',
      groupName: (payment.groupId as any)?.name || 'Unknown',
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      paymentDate: payment.paymentDate,
      notes: payment.notes
    }

    // Generate PDF
    const pdfBuffer = await generatePaymentReceipt(receiptData)

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="payment-receipt-${receiptData.receiptNumber}.pdf"`)

    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Generate payment receipt error:', error)
    res.status(500).json({ message: 'Server error while generating payment receipt' })
  }
})

// @desc    Generate withdrawal receipt PDF
// @route   GET /api/reports/withdrawals/:withdrawalId/receipt
// @access  Private
router.get('/withdrawals/:withdrawalId/receipt', [
  param('withdrawalId').notEmpty().withMessage('Withdrawal ID is required')
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { withdrawalId } = req.params

    // Get withdrawal details
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      adminId: req.user._id.toString()
    }).populate('memberId', 'name phoneNumber').populate('groupId', 'name')

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    // Prepare receipt data
    const receiptData = {
      receiptNumber: `WDR-${withdrawal._id.toString().slice(-6).toUpperCase()}`,
      memberName: (withdrawal.memberId as any)?.name || 'Unknown',
      phoneNumber: (withdrawal.memberId as any)?.phoneNumber || 'N/A',
      groupName: (withdrawal.groupId as any)?.name || 'Unknown',
      amount: withdrawal.amount,
      status: withdrawal.status,
      reason: withdrawal.reason,
      approvedBy: withdrawal.approvedBy,
      approvedAt: withdrawal.approvedAt,
      withdrawalDate: withdrawal.withdrawalDate,
      notes: withdrawal.notes
    }

    // Generate PDF
    const pdfBuffer = await generateWithdrawalReceipt(receiptData)

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="withdrawal-receipt-${receiptData.receiptNumber}.pdf"`)

    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Generate withdrawal receipt error:', error)
    res.status(500).json({ message: 'Server error while generating withdrawal receipt' })
  }
})

// @desc    Generate member statement PDF
// @route   GET /api/reports/members/:memberId/statement
// @access  Private
router.get('/members/:memberId/statement', [
  param('memberId').notEmpty().withMessage('Member ID is required'),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 })
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { memberId } = req.params
    const { month, year } = req.query

    // Validate member exists and belongs to admin
    const member = await Member.findOne({
      _id: memberId,
      adminId: req.user._id.toString()
    })

    if (!member) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Get member's payments
    const paymentQuery: any = {
      memberId,
      adminId: req.user._id.toString()
    }
    
    if (month) paymentQuery.month = parseInt(month as string)
    if (year) paymentQuery.year = parseInt(year as string)

    const payments = await Payment.find(paymentQuery)
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })

    // Get member's withdrawals
    const withdrawalQuery: any = {
      memberId,
      adminId: req.user._id.toString()
    }
    
    if (month) withdrawalQuery.month = parseInt(month as string)
    if (year) withdrawalQuery.year = parseInt(year as string)

    const withdrawals = await Withdrawal.find(withdrawalQuery)
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })

    // Calculate summary
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalWithdrawn = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)
    const balance = totalPaid - totalWithdrawn

    // Prepare statement data
    const statementData = {
      memberName: member.name,
      phoneNumber: member.phoneNumber,
      period: month && year ? `${new Date(parseInt(year as string), parseInt(month as string) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'All Time',
      payments: payments.map(p => ({
        date: p.paymentDate,
        group: (p.groupId as any)?.name || 'Unknown',
        amount: p.amount,
        status: p.status,
        method: p.paymentMethod
      })),
      withdrawals: withdrawals.map(w => ({
        date: w.withdrawalDate,
        group: (w.groupId as any)?.name || 'Unknown',
        amount: w.amount,
        status: w.status,
        reason: w.reason
      })),
      summary: {
        totalPaid,
        totalWithdrawn,
        balance
      }
    }

    // Generate PDF (using group report generator with modified data)
    const pdfBuffer = await generateGroupReport({
      group: {
        name: `${member.name} - Statement`,
        adminName: req.user.name,
        monthlyContribution: 0,
        createdAt: new Date()
      },
      members: [member.toObject()],
      payments: statementData.payments.map(p => ({
        memberName: member.name,
        amount: p.amount,
        status: p.status,
        paymentDate: p.date,
        paymentMethod: p.method
      })),
      withdrawals: statementData.withdrawals.map(w => ({
        memberName: member.name,
        amount: w.amount,
        status: w.status,
        withdrawalDate: w.date,
        reason: w.reason
      })),
      summary: {
        totalMembers: 1,
        totalPayments: statementData.payments.length,
        totalAmountCollected: statementData.summary.totalPaid,
        totalWithdrawals: statementData.withdrawals.length,
        totalAmountWithdrawn: statementData.summary.totalWithdrawn,
        pendingPayments: 0,
        pendingWithdrawals: 0
      }
    })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="statement-${member.name}-${new Date().toISOString()}.pdf"`)

    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Generate member statement error:', error)
    res.status(500).json({ message: 'Server error while generating member statement' })
  }
})

export default router