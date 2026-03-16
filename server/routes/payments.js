const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const ChitGroup = require('../models/ChitGroup');
const PDFService = require('../services/pdfService');
const NotificationService = require('../services/notificationService');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/record
// @desc    Record payment for a member
// @access  Private
router.post('/record', auth, [
  body('memberId', 'Member ID is required').not().isEmpty(),
  body('chitGroupId', 'Chit group ID is required').not().isEmpty(),
  body('month', 'Payment month is required').isInt({ min: 1 }),
  body('amount', 'Payment amount is required').isNumeric(),
  body('paymentMethod', 'Payment method is required').isIn(['cash', 'bank_transfer', 'upi', 'cheque']),
  body('receivedBy', 'Received by is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { memberId, chitGroupId, month, amount, paymentMethod, receivedBy, notes } = req.body;

    // Check if member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check if chit group exists
    const chitGroup = await ChitGroup.findById(chitGroupId);
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Check if member belongs to this chit group
    if (member.chitGroupId.toString() !== chitGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Member does not belong to this chit group'
      });
    }

    // Check if month is valid
    if (month > chitGroup.duration) {
      return res.status(400).json({
        success: false,
        message: `Month cannot exceed chit duration of ${chitGroup.duration} months`
      });
    }

    // Check if payment already exists for this month
    const existingPayment = await Payment.findOne({ memberId, chitGroupId, month });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Payment already recorded for month ${month}`
      });
    }

    // Create new payment
    const payment = new Payment({
      memberId,
      chitGroupId,
      month,
      amount,
      paymentMethod,
      receivedBy,
      notes
    });

    await payment.save();

    // Update member's total paid
    member.totalPaid += amount;
    await member.save();

    // Update chit group's total collected
    chitGroup.totalCollected += amount;
    await chitGroup.save();

    // Generate PDF receipt in memory (no file saved)
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.admin.id);
    const { buffer: pdfBuffer, fileName } = await PDFService.generatePaymentReceipt(payment, member, chitGroup, admin);

    // Send WhatsApp notification — PDF buffer sent directly, no file stored
    try {
      const waCredentials = (admin?.whatsappEnabled && admin?.whatsappPhoneNumberId && admin?.whatsappAccessToken)
        ? { phoneNumberId: admin.whatsappPhoneNumberId, accessToken: admin.whatsappAccessToken, fromNumber: admin.whatsappFromNumber }
        : null;
      const notificationService = new NotificationService(waCredentials);
      await notificationService.sendPaymentReceipt(member, payment, chitGroup, pdfBuffer, fileName);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        member: {
          id: member._id,
          name: member.name,
          totalPaid: member.totalPaid,
          totalDue: await member.getTotalDue()
        }
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, chitGroupId, memberId, month, startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    if (chitGroupId) {
      query.chitGroupId = chitGroupId;
    }
    
    if (memberId) {
      query.memberId = memberId;
    }
    
    if (month) {
      query.month = month;
    }
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }

    // Get payments with pagination and populate
    const payments = await Payment.find(query)
      .populate('memberId', 'name phone email')
      .populate('chitGroupId', 'name')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPayments: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('memberId', 'name phone email address')
      .populate('chitGroupId', 'name monthlyContribution duration');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        payment
      }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', auth, [
  body('amount', 'Payment amount is required').isNumeric(),
  body('paymentMethod', 'Payment method is required').isIn(['cash', 'bank_transfer', 'upi', 'cheque']),
  body('receivedBy', 'Received by is required').not().isEmpty(),
  body('notes', 'Notes must be less than 200 characters').isLength({ max: 200 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { amount, paymentMethod, receivedBy, notes } = req.body;

    let payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Get member and chit group for updates
    const member = await Member.findById(payment.memberId);
    const chitGroup = await ChitGroup.findById(payment.chitGroupId);

    // Update chit group total collected (subtract old amount, add new amount)
    chitGroup.totalCollected = chitGroup.totalCollected - payment.amount + amount;
    await chitGroup.save();

    // Update member total paid (subtract old amount, add new amount)
    member.totalPaid = member.totalPaid - payment.amount + amount;
    await member.save();

    // Update payment
    payment.amount = amount;
    payment.paymentMethod = paymentMethod;
    payment.receivedBy = receivedBy;
    payment.notes = notes;
    payment.isVerified = true; // Mark as verified when updated

    await payment.save();

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: {
        payment,
        member: {
          id: member._id,
          name: member.name,
          totalPaid: member.totalPaid,
          totalDue: await member.getTotalDue()
        }
      }
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Get member and chit group for updates
    const member = await Member.findById(payment.memberId);
    const chitGroup = await ChitGroup.findById(payment.chitGroupId);

    // Update chit group total collected (subtract payment amount)
    chitGroup.totalCollected -= payment.amount;
    await chitGroup.save();

    // Update member total paid (subtract payment amount)
    member.totalPaid -= payment.amount;
    await member.save();

    await Payment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/monthly-report/:chitGroupId/:month
// @desc    Get monthly collection report
// @access  Private
router.get('/monthly-report/:chitGroupId/:month', auth, async (req, res) => {
  try {
    const { chitGroupId, month } = req.params;
    
    const report = await Payment.getMonthlyCollectionReport(chitGroupId, parseInt(month));
    
    // Get chit group info
    const chitGroup = await ChitGroup.findById(chitGroupId);
    
    res.json({
      success: true,
      data: {
        report,
        chitGroup: {
          name: chitGroup.name,
          monthlyContribution: chitGroup.monthlyContribution,
          totalMembers: chitGroup.totalMembers,
          expectedCollection: chitGroup.monthlyContribution * chitGroup.totalMembers
        }
      }
    });

  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payments/member-history/:memberId
// @desc    Get member payment history
// @access  Private
router.get('/member-history/:memberId', auth, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const paymentHistory = await Payment.getMemberPaymentHistory(memberId);
    
    // Get member info
    const member = await Member.findById(memberId).populate('chitGroupId', 'name');
    
    // Calculate totals
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = await member.getTotalDue();

    res.json({
      success: true,
      data: {
        member: {
          id: member._id,
          name: member.name,
          phone: member.phone,
          chitGroup: member.chitGroupId.name,
          totalPaid,
          totalDue
        },
        paymentHistory
      }
    });

  } catch (error) {
    console.error('Get member payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/bulk-record
// @desc    Record multiple payments at once
// @access  Private
router.post('/bulk-record', auth, async (req, res) => {
  try {
    const { payments } = req.body;
    
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payments array is required'
      });
    }

    const results = [];
    let totalAmount = 0;

    for (const paymentData of payments) {
      try {
        const { memberId, chitGroupId, month, amount, paymentMethod, receivedBy } = paymentData;

        // Check if member exists
        const member = await Member.findById(memberId);
        if (!member) {
          results.push({
            memberId,
            success: false,
            error: 'Member not found'
          });
          continue;
        }

        // Check if chit group exists
        const chitGroup = await ChitGroup.findById(chitGroupId);
        if (!chitGroup) {
          results.push({
            memberId,
            success: false,
            error: 'Chit group not found'
          });
          continue;
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ memberId, chitGroupId, month });
        if (existingPayment) {
          results.push({
            memberId,
            success: false,
            error: `Payment already exists for month ${month}`
          });
          continue;
        }

        // Create payment
        const payment = new Payment({
          memberId,
          chitGroupId,
          month,
          amount,
          paymentMethod,
          receivedBy
        });

        await payment.save();

        // Update member and chit group totals
        member.totalPaid += amount;
        await member.save();

        chitGroup.totalCollected += amount;
        await chitGroup.save();

        totalAmount += amount;

        results.push({
          memberId,
          success: true,
          paymentId: payment._id,
          amount: payment.amount
        });

      } catch (error) {
        results.push({
          memberId: paymentData.memberId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `${results.filter(r => r.success).length} payments recorded successfully`,
      data: {
        results,
        totalAmount,
        summary: {
          totalProcessed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });

  } catch (error) {
    console.error('Bulk record payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;