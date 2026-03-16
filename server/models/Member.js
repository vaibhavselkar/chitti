const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  chitGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChitGroup',
    required: [true, 'Chit group is required']
  },
  withdrawMonth: {
    type: Number,
    min: [1, 'Withdraw month must be at least 1'],
    max: [100, 'Withdraw month cannot exceed 100']
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  totalPayoutReceived: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
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

memberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

memberSchema.statics.getPaymentStatus = async function(memberId, chitGroupId) {
  const Payment = mongoose.model('Payment');
  const payments = await Payment.find({ memberId, chitGroupId }).sort({ month: 1 });
  const chitGroup = await mongoose.model('ChitGroup').findById(chitGroupId);

  const paymentStatus = [];
  for (let month = 1; month <= chitGroup.duration; month++) {
    const payment = payments.find(p => p.month === month);
    paymentStatus.push({
      month,
      paid: !!payment,
      amount: payment ? payment.amount : 0,
      date: payment ? payment.paymentDate : null,
      adminSignatureImage: payment ? payment.adminSignatureImage : null,
      receiptNumber: payment ? payment.receiptNumber : null
    });
  }
  return paymentStatus;
};

memberSchema.methods.getTotalDue = async function() {
  const chitGroup = await mongoose.model('ChitGroup').findById(this.chitGroupId);
  const totalExpected = chitGroup.monthlyContribution * chitGroup.duration;
  return totalExpected - this.totalPaid;
};

module.exports = mongoose.model('Member', memberSchema);
