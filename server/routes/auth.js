const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');
const { adminSignatureUpload } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new admin
// @access  Public
router.post('/register', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('role', 'Role is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, email, password, role } = req.body;

    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin
    admin = new Admin({
      name,
      email,
      password,
      role
    });

    await admin.save();

    // Generate JWT token
    const token = admin.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = admin.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current admin profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        admin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update admin profile
// @access  Private
router.put('/profile', auth, [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, email } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is already taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    admin.name = name;
    admin.email = email;
    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change admin password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/whatsapp
// @desc    Save admin's Meta WhatsApp credentials
// @access  Private
router.put('/whatsapp', auth, [
  body('whatsappPhoneNumberId', 'Phone Number ID is required').not().isEmpty(),
  body('whatsappAccessToken', 'Access Token is required').not().isEmpty(),
  body('whatsappFromNumber', 'WhatsApp number is required').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { whatsappPhoneNumberId, whatsappAccessToken, whatsappFromNumber } = req.body;
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.whatsappPhoneNumberId = whatsappPhoneNumberId;
    admin.whatsappAccessToken   = whatsappAccessToken;
    admin.whatsappFromNumber    = whatsappFromNumber;
    admin.whatsappEnabled       = true;
    await admin.save();

    res.json({ success: true, message: 'WhatsApp credentials saved successfully' });
  } catch (error) {
    console.error('Save WA credentials error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/auth/whatsapp
// @desc    Disconnect WhatsApp
// @access  Private
router.delete('/whatsapp', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.whatsappPhoneNumberId = null;
    admin.whatsappAccessToken   = null;
    admin.whatsappFromNumber    = null;
    admin.whatsappEnabled       = false;
    await admin.save();

    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (error) {
    console.error('Disconnect WA error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/whatsapp/test
// @desc    Send a test WhatsApp message using admin's credentials
// @access  Private
router.post('/whatsapp/test', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !admin.whatsappEnabled) {
      return res.status(400).json({ success: false, message: 'WhatsApp not configured' });
    }

    const NotificationService = require('../services/notificationService');
    const svc = new NotificationService({
      phoneNumberId: admin.whatsappPhoneNumberId,
      accessToken:   admin.whatsappAccessToken,
      fromNumber:    admin.whatsappFromNumber
    });

    const testPhone = req.body.phone || admin.whatsappFromNumber;
    const result = await svc.sendGeneralNotification(
      testPhone,
      `Hello! This is a test message from *Chitti Management System*. Your WhatsApp integration is working correctly. ✅`
    );

    res.json({ success: result.success, data: result });
  } catch (error) {
    console.error('WA test error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/whatsapp/status
// @desc    Get WhatsApp connection status
// @access  Private
router.get('/whatsapp/status', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    res.json({
      success: true,
      data: {
        enabled: admin.whatsappEnabled || false,
        fromNumber: admin.whatsappFromNumber || null,
        hasCredentials: !!(admin.whatsappPhoneNumberId && admin.whatsappAccessToken)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/update-signature
// @desc    Update admin digital signature
// @access  Private
router.put('/update-signature', auth, adminSignatureUpload.single('signature'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a signature image'
      });
    }

    // Update signature image path
    admin.digitalSignatureImage = `/uploads/admins/${req.file.filename}`;
    await admin.save();

    res.json({
      success: true,
      message: 'Signature updated successfully',
      data: {
        signatureUrl: admin.digitalSignatureImage
      }
    });

  } catch (error) {
    console.error('Update signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
