const express = require('express');
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const ChitGroup = require('../models/ChitGroup');
const PDFService = require('../services/pdfService');
const NotificationService = require('../services/notificationService');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/notifications/sendPaymentReceipt
// @desc    Send payment receipt to member
// @access  Private
router.post('/sendPaymentReceipt', auth, [
  body('paymentId', 'Payment ID is required').not().isEmpty(),
  body('memberId', 'Member ID is required').not().isEmpty(),
  body('chitGroupId', 'Chit group ID is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { paymentId, memberId, chitGroupId } = req.body;

    // Get payment, member, and chit group
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(paymentId);
    const member = await Member.findById(memberId);
    const chitGroup = await ChitGroup.findById(chitGroupId);

    if (!payment || !member || !chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Payment, member, or chit group not found'
      });
    }

    // Generate PDF receipt
    const receipt = await PDFService.generatePaymentReceipt(payment, member, chitGroup);

    // Send notifications using user's WhatsApp number
    const notificationService = new NotificationService();
    const result = await notificationService.sendPaymentReceipt(
      member, 
      payment, 
      chitGroup, 
      receipt.url, 
      req.body.userWhatsAppNumber
    );

    res.json({
      success: true,
      message: 'Payment receipt sent successfully',
      data: {
        result,
        receipt
      }
    });

  } catch (error) {
    console.error('Send payment receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment receipt'
    });
  }
});

// @route   POST /api/notifications/sendBulk
// @desc    Send bulk notifications to members
// @access  Private
router.post('/sendBulk', auth, [
  body('chitGroupId', 'Chit group ID is required').not().isEmpty(),
  body('message', 'Message is required').not().isEmpty(),
  body('memberIds', 'Member IDs array is required').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { chitGroupId, message, memberIds, mediaUrl } = req.body;

    // Get chit group
    const chitGroup = await ChitGroup.findById(chitGroupId);
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Get members
    const members = await Member.find({ 
      _id: { $in: memberIds },
      chitGroupId: chitGroupId 
    });

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No members found'
      });
    }

    // Send notifications using user's WhatsApp number
    const notificationService = new NotificationService();
    const results = await notificationService.sendBulkNotification(
      members, 
      message, 
      mediaUrl, 
      req.body.userWhatsAppNumber
    );

    res.json({
      success: true,
      message: 'Bulk notifications sent successfully',
      data: {
        results,
        summary: {
          totalMembers: members.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });

  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications'
    });
  }
});

// @route   POST /api/notifications/sendGeneral
// @desc    Send general notification to a member
// @access  Private
router.post('/sendGeneral', auth, [
  body('memberId', 'Member ID is required').not().isEmpty(),
  body('message', 'Message is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { memberId, message, mediaUrl } = req.body;

    // Get member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Send notification using user's WhatsApp number
    const notificationService = new NotificationService();
    const result = await notificationService.sendGeneralNotification(
      member.phone, 
      message, 
      mediaUrl, 
      req.body.userWhatsAppNumber
    );

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        result,
        member: {
          id: member._id,
          name: member.name,
          phone: member.phone
        }
      }
    });

  } catch (error) {
    console.error('Send general notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// @route   POST /api/notifications/sendPaymentReminder
// @desc    Send payment reminder to members with pending payments
// @access  Private
router.post('/sendPaymentReminder', auth, [
  body('chitGroupId', 'Chit group ID is required').not().isEmpty(),
  body('month', 'Month is required').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { chitGroupId, month } = req.body;

    // Get chit group
    const chitGroup = await ChitGroup.findById(chitGroupId);
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Get members
    const members = await Member.find({ chitGroupId: chitGroup._id });

    // Get pending payments for the month
    const Payment = require('../models/Payment');
    const pendingPayments = [];
    
    for (const member of members) {
      const payment = await Payment.findOne({ 
        memberId: member._id, 
        chitGroupId: chitGroup._id, 
        month 
      });
      
      if (!payment) {
        pendingPayments.push(member);
      }
    }

    if (pendingPayments.length === 0) {
      return res.json({
        success: true,
        message: 'No pending payments for this month'
      });
    }

    // Send reminders
    const notificationService = new NotificationService();
    const message = `Reminder: Payment for Month ${month} of ${chitGroup.name} is pending. Amount: ₹${chitGroup.monthlyContribution.toLocaleString()}. Please make the payment at your earliest.`;
    
    const results = await notificationService.sendBulkNotification(pendingPayments, message);

    res.json({
      success: true,
      message: `${pendingPayments.length} payment reminders sent successfully`,
      data: {
        results,
        summary: {
          totalPending: pendingPayments.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });

  } catch (error) {
    console.error('Send payment reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminders'
    });
  }
});

// @route   GET /api/notifications/templates
// @desc    Get notification templates
// @access  Private
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = {
      paymentConfirmation: {
        id: 'payment_confirmation',
        name: 'Payment Confirmation',
        sms: 'Payment received for Month {month} of {chitName}. Amount ₹{amount}. Total paid: ₹{totalPaid}.',
        whatsapp: 'Hello {name},\n\nYour chit payment for Month {month} has been recorded.\n\nChit: {chitName}\nAmount: ₹{amount}\nDate: {date}\n\nTotal Paid: ₹{totalPaid}\n\nThank you!'
      },
      paymentReminder: {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        sms: 'Reminder: Payment for Month {month} of {chitName} is pending. Amount: ₹{amount}. Please make the payment at your earliest.',
        whatsapp: 'Hello {name},\n\nThis is a reminder that your payment for Month {month} of {chitName} is pending.\n\nAmount: ₹{amount}\nDue Date: {dueDate}\n\nPlease make the payment at your earliest.\n\nThank you!'
      },
      welcomeMessage: {
        id: 'welcome_message',
        name: 'Welcome Message',
        sms: 'Welcome to {chitName}! Your membership is confirmed. Monthly contribution: ₹{amount}. Duration: {duration} months.',
        whatsapp: 'Hello {name},\n\nWelcome to {chitName}!\n\nWe are pleased to inform you that your membership has been confirmed.\n\nDetails:\n- Monthly Contribution: ₹{amount}\n- Duration: {duration} months\n- Start Date: {startDate}\n\nThank you for joining us!'
      }
    };

    res.json({
      success: true,
      data: {
        templates
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification templates'
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Test notification service
// @access  Private
router.post('/test', auth, [
  body('phone', 'Phone number is required').isLength({ min: 10, max: 10 }),
  body('message', 'Message is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { phone, message } = req.body;

    // Send test notification
    const notificationService = new NotificationService();
    const result = await notificationService.sendGeneralNotification(phone, message);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        result
      }
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router;