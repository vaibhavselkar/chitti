const express = require('express');
const { body, validationResult } = require('express-validator');
const xlsx = require('xlsx');
const ChitGroup = require('../models/ChitGroup');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chits/create
// @desc    Create new chit group
// @access  Private
router.post('/create', auth, [
  body('name', 'Chit name is required').not().isEmpty(),
  body('monthlyContribution', 'Monthly contribution is required').isNumeric(),
  body('duration', 'Duration is required').isInt({ min: 1 }),
  body('totalMembers', 'Total members is required').isInt({ min: 2 }),
  body('startDate', 'Start date is required').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, monthlyContribution, duration, totalMembers, startDate, collectionDay, payoutSchedule } = req.body;
    console.log('[CreateChit] collectionDay received:', collectionDay, '| type:', typeof collectionDay);

    // Check if chit group already exists
    let chitGroup = await ChitGroup.findOne({ name });
    if (chitGroup) {
      return res.status(400).json({
        success: false,
        message: 'Chit group with this name already exists'
      });
    }

    // Create new chit group
    chitGroup = new ChitGroup({
      name,
      monthlyContribution,
      duration,
      totalMembers,
      startDate,
      collectionDay: collectionDay || 10,
      payoutSchedule,
      adminId: req.admin.id
    });

    await chitGroup.save();

    res.status(201).json({
      success: true,
      message: 'Chit group created successfully',
      data: {
        chitGroup
      }
    });

  } catch (error) {
    console.error('Create chit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chits
// @desc    Get all chit groups
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chitGroups = await ChitGroup.find().sort({ createdAt: -1 });

    // Add additional stats to each chit group
    const chitGroupsWithStats = await Promise.all(
      chitGroups.map(async (chit) => {
        const memberCount = await Member.countDocuments({ chitGroupId: chit._id });
        const totalCollected = await Payment.aggregate([
          { $match: { chitGroupId: chit._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...chit.toObject(),
          memberCount,
          totalCollected: totalCollected[0]?.total || 0,
          expectedCollection: chit.monthlyContribution * chit.totalMembers * chit.duration
        };
      })
    );

    res.json({
      success: true,
      data: {
        chitGroups: chitGroupsWithStats
      }
    });

  } catch (error) {
    console.error('Get chits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chits/:id
// @desc    Get chit group by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const chitGroup = await ChitGroup.findById(req.params.id);
    
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Get members for this chit group
    const members = await Member.find({ chitGroupId: chitGroup._id }).sort({ name: 1 });

    // Get payment stats
    const paymentStats = await Payment.aggregate([
      { $match: { chitGroupId: chitGroup._id } },
      { $group: { _id: null, totalPayments: { $sum: 1 }, totalCollected: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        chitGroup,
        members,
        stats: {
          totalMembers: members.length,
          totalPayments: paymentStats[0]?.totalPayments || 0,
          totalCollected: paymentStats[0]?.totalCollected || 0,
          expectedCollection: chitGroup.monthlyContribution * chitGroup.totalMembers * chitGroup.duration
        }
      }
    });

  } catch (error) {
    console.error('Get chit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/chits/:id
// @desc    Update chit group
// @access  Private
router.put('/:id', auth, [
  body('name', 'Chit name is required').not().isEmpty(),
  body('monthlyContribution', 'Monthly contribution is required').isNumeric(),
  body('duration', 'Duration is required').isInt({ min: 1 }),
  body('totalMembers', 'Total members is required').isInt({ min: 2 }),
  body('status', 'Status is required').isIn(['active', 'completed', 'cancelled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, monthlyContribution, duration, totalMembers, status, payoutSchedule } = req.body;

    let chitGroup = await ChitGroup.findById(req.params.id);
    
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Update fields
    chitGroup.name = name;
    chitGroup.monthlyContribution = monthlyContribution;
    chitGroup.duration = duration;
    chitGroup.totalMembers = totalMembers;
    chitGroup.status = status;
    if (payoutSchedule) {
      chitGroup.payoutSchedule = payoutSchedule;
    }

    await chitGroup.save();

    res.json({
      success: true,
      message: 'Chit group updated successfully',
      data: {
        chitGroup
      }
    });

  } catch (error) {
    console.error('Update chit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/chits/:id
// @desc    Delete chit group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const chitGroup = await ChitGroup.findById(req.params.id);
    
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Check if chit group has members or payments
    const memberCount = await Member.countDocuments({ chitGroupId: chitGroup._id });
    const paymentCount = await Payment.countDocuments({ chitGroupId: chitGroup._id });

    if (memberCount > 0 || paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete chit group with members or payments'
      });
    }

    await ChitGroup.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Chit group deleted successfully'
    });

  } catch (error) {
    console.error('Delete chit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/chits/:id/upload-payout-schedule
// @desc    Upload payout schedule from Excel
// @access  Private
router.post('/:id/upload-payout-schedule', auth, async (req, res) => {
  try {
    const chitGroup = await ChitGroup.findById(req.params.id);
    
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // This would typically handle file upload
    // For now, we'll expect the payout schedule in the request body
    const { payoutSchedule } = req.body;

    if (!payoutSchedule || !Array.isArray(payoutSchedule)) {
      return res.status(400).json({
        success: false,
        message: 'Payout schedule is required'
      });
    }

    // Validate payout schedule
    for (let i = 0; i < payoutSchedule.length; i++) {
      const item = payoutSchedule[i];
      if (!item.month || !item.payoutAmount) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout schedule format'
        });
      }
      if (item.month < 1 || item.month > chitGroup.duration) {
        return res.status(400).json({
          success: false,
          message: `Invalid month: ${item.month}. Must be between 1 and ${chitGroup.duration}`
        });
      }
    }

    chitGroup.payoutSchedule = payoutSchedule;
    await chitGroup.save();

    res.json({
      success: true,
      message: 'Payout schedule updated successfully',
      data: {
        chitGroup
      }
    });

  } catch (error) {
    console.error('Upload payout schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/chits/:id/dashboard
// @desc    Get chit group dashboard data
// @access  Private
router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    const chitGroup = await ChitGroup.findById(req.params.id);
    
    if (!chitGroup) {
      return res.status(404).json({
        success: false,
        message: 'Chit group not found'
      });
    }

    // Get members
    const members = await Member.find({ chitGroupId: chitGroup._id }).sort({ name: 1 });

    // Get payment data for the payment grid
    const paymentGrid = [];
    for (let month = 1; month <= chitGroup.duration; month++) {
      const monthPayments = [];
      for (const member of members) {
        const payment = await Payment.findOne({ 
          memberId: member._id, 
          chitGroupId: chitGroup._id, 
          month 
        });
        
        monthPayments.push({
          memberId: member._id,
          memberName: member.name,
          month,
          paid: !!payment,
          amount: payment ? payment.amount : 0,
          date: payment ? payment.paymentDate : null
        });
      }
      paymentGrid.push({
        month,
        payments: monthPayments
      });
    }

    // Get monthly collection data for chart
    const monthlyCollections = [];
    for (let month = 1; month <= chitGroup.duration; month++) {
      const collection = await Payment.aggregate([
        { $match: { chitGroupId: chitGroup._id, month } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      monthlyCollections.push({
        month,
        amount: collection[0]?.total || 0,
        expected: chitGroup.monthlyContribution * chitGroup.totalMembers
      });
    }

    res.json({
      success: true,
      data: {
        chitGroup,
        members,
        paymentGrid,
        monthlyCollections,
        stats: {
          totalMembers: members.length,
          currentMonth: chitGroup.getCurrentMonth(),
          totalCollected: chitGroup.totalCollected,
          totalExpected: chitGroup.monthlyContribution * chitGroup.totalMembers * chitGroup.duration
        }
      }
    });

  } catch (error) {
    console.error('Get chit dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;