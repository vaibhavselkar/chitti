const express = require('express');
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const ChitGroup = require('../models/ChitGroup');
const Payment = require('../models/Payment');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/members/add
// @desc    Add new member to chit group (name + phone only)
// @access  Private
router.post('/add', auth, [
  body('name', 'Member name is required').not().isEmpty(),
  body('phone', 'Phone must be exactly 10 digits').matches(/^\d{10}$/),
  body('chitGroupId', 'Chit group is required').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, phone, chitGroupId } = req.body;

    const chitGroup = await ChitGroup.findById(chitGroupId);
    if (!chitGroup) {
      return res.status(404).json({ success: false, message: 'Chit group not found' });
    }

    const existingMember = await Member.findOne({ phone, chitGroupId });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Member with this phone already exists in this chit group' });
    }

    const member = new Member({ name, phone, chitGroupId });
    await member.save();

    res.status(201).json({ success: true, message: 'Member added successfully', data: { member } });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/members
// @desc    Get all members
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, chitGroupId, search } = req.query;
    let query = {};
    if (chitGroupId) query.chitGroupId = chitGroupId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(query)
      .populate('chitGroupId', 'name collectionDay')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Member.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMembers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/members/:id
// @desc    Get member by ID with payment history
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('chitGroupId', 'name monthlyContribution duration collectionDay');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const paymentHistory = await Payment.find({ memberId: member._id }).sort({ month: 1 });
    const paymentStatus = await Member.getPaymentStatus(member._id, member.chitGroupId);
    const totalDue = await member.getTotalDue();

    // Get admin signature to include in payment status
    const admin = await Admin.findOne();
    const adminSignatureImage = admin ? admin.digitalSignatureImage : null;

    res.json({
      success: true,
      data: {
        member,
        paymentHistory,
        paymentStatus,
        adminSignatureImage,
        totals: {
          totalPaid: member.totalPaid,
          totalDue,
          totalExpected: member.chitGroupId.monthlyContribution * member.chitGroupId.duration
        }
      }
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/members/:id
// @desc    Update member
// @access  Private
router.put('/:id', auth, [
  body('name', 'Member name is required').not().isEmpty(),
  body('phone', 'Phone must be exactly 10 digits').matches(/^\d{10}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, phone } = req.body;
    let member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const existingMember = await Member.findOne({
      _id: { $ne: member._id },
      phone,
      chitGroupId: member.chitGroupId
    });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Member with this phone already exists in this chit group' });
    }

    member.name = name;
    member.phone = phone;
    await member.save();

    res.json({ success: true, message: 'Member updated successfully', data: { member } });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/members/:id
// @desc    Delete member
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const paymentCount = await Payment.countDocuments({ memberId: member._id });
    if (paymentCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete member with payment history' });
    }

    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/members/:id/payment-status
// @access  Private
router.get('/:id/payment-status', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const paymentStatus = await Member.getPaymentStatus(member._id, member.chitGroupId);
    const totalDue = await member.getTotalDue();
    const chitGroup = await ChitGroup.findById(member.chitGroupId);

    res.json({
      success: true,
      data: {
        member: { id: member._id, name: member.name, phone: member.phone, totalPaid: member.totalPaid, totalDue },
        paymentStatus,
        summary: {
          totalMonths: chitGroup.duration,
          paidMonths: paymentStatus.filter(p => p.paid).length,
          pendingMonths: paymentStatus.filter(p => !p.paid).length,
          currentMonth: chitGroup.getCurrentMonth()
        }
      }
    });
  } catch (error) {
    console.error('Get member payment status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/members/:id/withdraw
// @desc    Record payout withdrawal for a member (sets withdrawMonth to the provided month)
// @access  Private
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (member.withdrawMonth) {
      return res.status(400).json({ success: false, message: 'Payout already recorded for this member' });
    }

    const chitGroup = await ChitGroup.findById(member.chitGroupId);
    const month = req.body.month || chitGroup.getCurrentMonth();

    if (month < 1 || month > chitGroup.duration) {
      return res.status(400).json({ success: false, message: `Month must be between 1 and ${chitGroup.duration}` });
    }

    member.withdrawMonth = month;
    await member.save();

    res.json({ success: true, message: 'Payout recorded successfully', data: { member } });
  } catch (error) {
    console.error('Record withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/members/:id/leave
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    if (!member.isActive) {
      return res.status(400).json({ success: false, message: 'Member is already inactive' });
    }

    member.isActive = false;
    member.leftAt = new Date();
    await member.save();

    res.json({ success: true, message: 'Member marked as left successfully' });
  } catch (error) {
    console.error('Mark member as left error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
