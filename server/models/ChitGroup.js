const mongoose = require('mongoose');

const payoutScheduleSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1 },
  payoutAmount: { type: Number, required: true, min: 0 }
});

const chitGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chit name is required'],
    trim: true,
    maxlength: [100, 'Chit name cannot exceed 100 characters']
  },
  monthlyContribution: {
    type: Number,
    required: [true, 'Monthly contribution is required'],
    min: [100, 'Monthly contribution must be at least ₹100']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 month']
  },
  totalMembers: {
    type: Number,
    required: [true, 'Total members is required'],
    min: [2, 'Must have at least 2 members']
  },
  // Admin who created this chit group
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  // Day of month for collection (1-28). Reminders sent 5 days before.
  collectionDay: {
    type: Number,
    required: [true, 'Collection day is required'],
    min: [1, 'Collection day must be between 1 and 28'],
    max: [28, 'Collection day must be between 1 and 28'],
    default: 10
  },
  payoutSchedule: [payoutScheduleSchema],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  totalCollected: {
    type: Number,
    default: 0
  },
  totalPayouts: {
    type: Number,
    default: 0
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

chitGroupSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('duration')) {
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.endDate.getMonth() + this.duration);
  }
  this.updatedAt = new Date();
  next();
});

chitGroupSchema.statics.calculateTotalCollection = function(monthlyContribution, totalMembers, duration) {
  return monthlyContribution * totalMembers * duration;
};

chitGroupSchema.methods.getCurrentMonth = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const diffTime = Math.abs(now - start);
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.min(diffMonths, this.duration);
};

chitGroupSchema.methods.isCompleted = function() {
  return this.status === 'completed' || new Date() >= this.endDate;
};

module.exports = mongoose.model('ChitGroup', chitGroupSchema);
