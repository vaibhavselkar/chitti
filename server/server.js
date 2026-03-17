const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const pdf = require('pdfkit');
const xlsx = require('xlsx');
const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chitti';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// File upload setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(uploadDir, file.fieldname);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve static files
app.use('/uploads', express.static(uploadDir));

// Database connection
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log(`Connected to: ${MONGODB_URI}`);
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Error name:', err.name);
  console.error('Full error:', JSON.stringify(err, null, 2));
  process.exit(1);
});

// Database Models
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date
});

const chitGroupSchema = new mongoose.Schema({
  name: String,
  monthlyContribution: Number,
  duration: Number,
  totalMembers: Number,
  payoutSchedule: [{ month: Number, payoutAmount: Number }],
  startDate: Date,
  endDate: Date,
  status: { type: String, default: 'active' },
  totalCollected: { type: Number, default: 0 }
});

const memberSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  aadhaarNumber: String,
  profilePhoto: String,
  digitalSignatureImage: String,
  chitGroupId: mongoose.Schema.Types.ObjectId,
  withdrawMonth: Number,
  totalPaid: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const paymentSchema = new mongoose.Schema({
  memberId: mongoose.Schema.Types.ObjectId,
  chitGroupId: mongoose.Schema.Types.ObjectId,
  month: Number,
  amount: Number,
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: String,
  receivedBy: String,
  receiptNumber: String,
  isVerified: { type: Boolean, default: false }
});

const Admin = mongoose.model('Admin', adminSchema);
const ChitGroup = mongoose.model('ChitGroup', chitGroupSchema);
const Member = mongoose.model('Member', memberSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper functions
const generateReceiptNumber = () => {
  return 'RCPT-' + Date.now().toString().slice(-6);
};

const generatePDFReceipt = async (payment, member, chitGroup) => {
  return new Promise((resolve, reject) => {
    const doc = new pdf();
    const filename = `receipt-${payment._id}.pdf`;
    const filePath = path.join(uploadDir, 'receipts', filename);
    
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(25).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${payment.receiptNumber}`);
    doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`);
    doc.text(`Member: ${member.name}`);
    doc.text(`Chit Group: ${chitGroup.name}`);
    doc.text(`Month: ${payment.month}`);
    doc.text(`Amount: ₹${payment.amount}`);
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    
    if (member.digitalSignatureImage) {
      doc.moveDown();
      doc.text('Member Signature:');
      doc.image(path.join(uploadDir, 'signatures', member.digitalSignatureImage), { width: 200 });
    }
    
    doc.end();
    
    doc.on('end', () => resolve(filename));
    doc.on('error', reject);
  });
};

const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const data = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: TWILIO_WHATSAPP_NUMBER || TWILIO_PHONE_NUMBER,
    Body: message
  });

  if (mediaUrl) {
    data.append('MediaUrl', mediaUrl);
  }

  const response = await axios.post(url, data, {
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN
    }
  });

  return response.data;
};

const sendEmail = async (to, subject, text, attachments = []) => {
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const mailOptions = {
    from: SMTP_USER,
    to,
    subject,
    text,
    attachments
  };

  return await transporter.sendMail(mailOptions);
};

// API Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword, role });
    await admin.save();

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.json({
      success: true,
      message: 'Admin registered successfully',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Chit Routes
app.post('/api/chits/create', authenticateToken, async (req, res) => {
  try {
    const { name, monthlyContribution, duration, totalMembers, payoutSchedule, startDate } = req.body;
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    const chitGroup = new ChitGroup({
      name,
      monthlyContribution,
      duration,
      totalMembers,
      payoutSchedule,
      startDate,
      endDate
    });

    await chitGroup.save();
    
    res.json({
      success: true,
      message: 'Chit group created successfully',
      chitGroup
    });
  } catch (error) {
    console.error('Create chit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/chits', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const chitGroups = await ChitGroup.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ChitGroup.countDocuments(query);
    
    res.json({
      success: true,
      chitGroups,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get chits error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/chits/:id', authenticateToken, async (req, res) => {
  try {
    const chitGroup = await ChitGroup.findById(req.params.id);
    if (!chitGroup) {
      return res.status(404).json({ success: false, message: 'Chit group not found' });
    }

    const members = await Member.find({ chitGroupId: chitGroup._id });
    
    res.json({
      success: true,
      chitGroup,
      members
    });
  } catch (error) {
    console.error('Get chit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Member Routes
app.post('/api/members/add', authenticateToken, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'digitalSignatureImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, phone, chitGroupId } = req.body;
    
    const chitGroup = await ChitGroup.findById(chitGroupId);
    if (!chitGroup) {
      return res.status(404).json({ success: false, message: 'Chit group not found' });
    }

    const member = new Member({
      name,
      phone,
      chitGroupId,
      profilePhoto: req.files.profilePhoto ? req.files.profilePhoto[0].filename : null,
      digitalSignatureImage: req.files.digitalSignatureImage ? req.files.digitalSignatureImage[0].filename : null
    });

    await member.save();
    
    res.json({
      success: true,
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/members', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, chitGroupId, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { isActive: true };
    if (chitGroupId) query.chitGroupId = chitGroupId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const members = await Member.find(query)
      .populate('chitGroupId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Member.countDocuments(query);
    
    res.json({
      success: true,
      members,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Payment Routes
app.post('/api/payments/record', authenticateToken, async (req, res) => {
  try {
    const { memberId, chitGroupId, month, amount, paymentMethod, receivedBy } = req.body;
    
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const payment = new Payment({
      memberId,
      chitGroupId,
      month,
      amount,
      paymentMethod,
      receivedBy,
      receiptNumber: generateReceiptNumber()
    });

    await payment.save();

    member.totalPaid += amount;
    await member.save();

    const chitGroup = await ChitGroup.findById(chitGroupId);
    chitGroup.totalCollected += amount;
    await chitGroup.save();

    const receipt = await generatePDFReceipt(payment, member, chitGroup);
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
      receipt
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, chitGroupId, memberId, month } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (chitGroupId) query.chitGroupId = chitGroupId;
    if (memberId) query.memberId = memberId;
    if (month) query.month = month;

    const payments = await Payment.find(query)
      .populate('memberId', 'name phone')
      .populate('chitGroupId', 'name')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      success: true,
      payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Notification Routes
app.post('/api/notifications/sendPaymentReceipt', authenticateToken, async (req, res) => {
  try {
    const { paymentId, memberId, chitGroupId } = req.body;
    
    const payment = await Payment.findById(paymentId);
    const member = await Member.findById(memberId);
    const chitGroup = await ChitGroup.findById(chitGroupId);

    if (!payment || !member || !chitGroup) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const receiptPath = path.join(uploadDir, 'receipts', `receipt-${payment._id}.pdf`);
    const receiptUrl = `${req.protocol}://${req.get('host')}/uploads/receipts/receipt-${payment._id}.pdf`;

    // Send WhatsApp message
    if (member.phone && TWILIO_ACCOUNT_SID) {
      await sendWhatsAppMessage(
        member.phone,
        `Payment receipt for ${chitGroup.name} - Month ${payment.month}: ₹${payment.amount}`,
        receiptUrl
      );
    }

    // Send email
    if (member.email && SMTP_USER) {
      await sendEmail(
        member.email,
        `Payment Receipt - ${chitGroup.name}`,
        `Dear ${member.name},\n\nYour payment of ₹${payment.amount} for month ${payment.month} has been recorded successfully.\n\nChit Group: ${chitGroup.name}\nPayment Date: ${new Date(payment.paymentDate).toLocaleDateString()}\n\nBest regards,\nChitti Management`,
        [{ filename: 'receipt.pdf', path: receiptPath }]
      );
    }

    res.json({
      success: true,
      message: 'Receipt sent successfully'
    });
  } catch (error) {
    console.error('Send receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    message: 'Chitti Backend Server',
    mongodb: {
      connected: isConnected,
      connectionState: states[mongoose.connection.readyState] ?? mongoose.connection.readyState
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  } else {
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: err.message,
      stack: err.stack
    });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).send('Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;