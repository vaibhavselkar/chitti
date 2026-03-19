import { Router } from 'express'
import { body, param } from 'express-validator'
import { 
  sendPaymentReminder, 
  sendPaymentConfirmation, 
  sendWithdrawalRequestNotification,
  sendWithdrawalApprovalNotification,
  sendWithdrawalRejectionNotification,
  sendGroupInvitation,
  sendBulkPaymentReminder,
  testConnection
} from '../services/whatsappService'
import { Payment } from '../models/Payment'
import { Withdrawal } from '../models/Withdrawal'
import { ChittiMember } from '../models/ChittiMember'
import { ChittiGroup } from '../models/ChittiGroup'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @desc    Send payment reminder to member
// @route   POST /api/notifications/payments/:paymentId/reminder
// @access  Private
router.post('/payments/:paymentId/reminder', [
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
    })

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    // Send WhatsApp reminder — memberId/groupId are stored as strings
    await sendPaymentReminder(payment.memberId, payment.groupId)

    res.json({
      success: true,
      message: 'Payment reminder sent successfully'
    })
  } catch (error: any) {
    console.error('Send payment reminder error:', error)
    res.status(500).json({ message: 'Failed to send payment reminder' })
  }
})

// @desc    Send payment confirmation
// @route   POST /api/notifications/payments/:paymentId/confirmation
// @access  Private
router.post('/payments/:paymentId/confirmation', [
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
    })

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    // Send WhatsApp confirmation
    await sendPaymentConfirmation(paymentId)

    res.json({
      success: true,
      message: 'Payment confirmation sent successfully'
    })
  } catch (error: any) {
    console.error('Send payment confirmation error:', error)
    res.status(500).json({ message: 'Failed to send payment confirmation' })
  }
})

// @desc    Send withdrawal request notification
// @route   POST /api/notifications/withdrawals/:withdrawalId/request
// @access  Private
router.post('/withdrawals/:withdrawalId/request', [
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
    })

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    // Send WhatsApp notification
    await sendWithdrawalRequestNotification(withdrawalId)

    res.json({
      success: true,
      message: 'Withdrawal request notification sent successfully'
    })
  } catch (error: any) {
    console.error('Send withdrawal request notification error:', error)
    res.status(500).json({ message: 'Failed to send withdrawal request notification' })
  }
})

// @desc    Send withdrawal approval notification
// @route   POST /api/notifications/withdrawals/:withdrawalId/approve
// @access  Private
router.post('/withdrawals/:withdrawalId/approve', [
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
    })

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Cannot approve withdrawal that is not pending' })
    }

    // Send WhatsApp approval notification
    await sendWithdrawalApprovalNotification(withdrawalId)

    res.json({
      success: true,
      message: 'Withdrawal approval notification sent successfully'
    })
  } catch (error: any) {
    console.error('Send withdrawal approval notification error:', error)
    res.status(500).json({ message: 'Failed to send withdrawal approval notification' })
  }
})

// @desc    Send withdrawal rejection notification
// @route   POST /api/notifications/withdrawals/:withdrawalId/reject
// @access  Private
router.post('/withdrawals/:withdrawalId/reject', [
  param('withdrawalId').notEmpty().withMessage('Withdrawal ID is required'),
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { withdrawalId } = req.params
    const { notes } = req.body

    // Get withdrawal details
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      adminId: req.user._id.toString()
    })

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' })
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Cannot reject withdrawal that is not pending' })
    }

    // Update withdrawal with rejection notes
    if (notes) {
      withdrawal.notes = notes
      await withdrawal.save()
    }

    // Send WhatsApp rejection notification
    await sendWithdrawalRejectionNotification(withdrawalId)

    res.json({
      success: true,
      message: 'Withdrawal rejection notification sent successfully'
    })
  } catch (error: any) {
    console.error('Send withdrawal rejection notification error:', error)
    res.status(500).json({ message: 'Failed to send withdrawal rejection notification' })
  }
})

// @desc    Send group invitation
// @route   POST /api/notifications/groups/:groupId/members/:memberId/invite
// @access  Private
router.post('/groups/:groupId/members/:memberId/invite', [
  param('groupId').notEmpty().withMessage('Group ID is required'),
  param('memberId').notEmpty().withMessage('Member ID is required')
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { groupId, memberId } = req.params

    // Validate group exists and belongs to admin
    const group = await ChittiMember.findOne({
      groupId,
      memberId,
      adminId: req.user._id.toString()
    }).populate('memberId', 'name phoneNumber').populate('groupId', 'name adminName')

    if (!group) {
      return res.status(404).json({ message: 'Group member relationship not found' })
    }

    // Send WhatsApp invitation
    await sendGroupInvitation(memberId, groupId)

    res.json({
      success: true,
      message: 'Group invitation sent successfully'
    })
  } catch (error: any) {
    console.error('Send group invitation error:', error)
    res.status(500).json({ message: 'Failed to send group invitation' })
  }
})

// @desc    Send bulk payment reminders
// @route   POST /api/notifications/groups/:groupId/reminders
// @access  Private
router.post('/groups/:groupId/reminders', [
  param('groupId').notEmpty().withMessage('Group ID is required'),
  body('memberIds').isArray({ min: 1 }).withMessage('At least one member ID is required'),
  body('memberIds.*').notEmpty().withMessage('Member ID cannot be empty')
], async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { groupId } = req.params
    const { memberIds } = req.body

    // Validate group exists and belongs to admin
    const group = await ChittiGroup.findOne({
      _id: groupId,
      adminId: req.user._id.toString()
    })

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    // Send bulk reminders
    await sendBulkPaymentReminder(groupId, memberIds)

    res.json({
      success: true,
      message: `Payment reminders sent to ${memberIds.length} members successfully`
    })
  } catch (error: any) {
    console.error('Send bulk payment reminders error:', error)
    res.status(500).json({ message: 'Failed to send bulk payment reminders' })
  }
})

// @desc    Test WhatsApp connection
// @route   GET /api/notifications/test
// @access  Private
router.get('/test', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const isConnected = await testConnection()

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'WhatsApp service is connected' : 'WhatsApp service is not connected'
    })
  } catch (error: any) {
    console.error('Test WhatsApp connection error:', error)
    res.status(500).json({ message: 'Failed to test WhatsApp connection' })
  }
})

// @desc    Get WhatsApp service status
// @route   GET /api/notifications/status
// @access  Private
router.get('/status', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const isConnected = await testConnection()

    res.json({
      success: true,
      whatsapp: {
        connected: isConnected,
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER)
      }
    })
  } catch (error: any) {
    console.error('Get WhatsApp status error:', error)
    res.status(500).json({ message: 'Failed to get WhatsApp status' })
  }
})

export default router