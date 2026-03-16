const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member is required']
  },
  chitGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChitGroup',
    required: [true, 'Chit group is required']
  },
  month: {
    type: Number,
    required: [true, 'Payment month is required'],
    min: [1, 'Month must be at least 1']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque'],
    default: 'cash'
  },
  receivedBy: {
    type: String,
    required: [true, 'Received by is required'],
    trim: true
  },
  // Admin's signature image stored per payment for the receipt column
  adminSignatureImage: {
    type: String,
    default: null
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    this.receiptNumber = `RCPT-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

paymentSchema.statics.getMonthlyCollectionReport = async function(chitGroupId, month) {
  const payments = await this.find({ chitGroupId, month }).populate('memberId', 'name phone');
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  return { month, totalPayments: payments.length, totalCollected, payments };
};

paymentSchema.statics.getMemberPaymentHistory = async function(memberId) {
  return await this.find({ memberId }).populate('chitGroupId', 'name').sort({ paymentDate: -1 });
};

paymentSchema.index({ memberId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
