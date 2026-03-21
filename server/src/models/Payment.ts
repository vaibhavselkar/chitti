import mongoose, { Document, Schema } from 'mongoose'

export interface IPayment extends Document {
  memberId: string
  groupId: string
  adminId: string
  month: number
  year: number
  amount: number
  paidAmount: number
  paymentDate: Date
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'
  paymentMethod?: string
  transactionId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<IPayment>({
  memberId: {
    type: String,
    required: [true, 'Member ID is required'],
    ref: 'Member'
  },
  groupId: {
    type: String,
    required: [true, 'Group ID is required'],
    ref: 'ChittiGroup'
  },
  adminId: {
    type: String,
    required: [true, 'Admin ID is required']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'],
    default: 'CASH'
  },
  transactionId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Compound index for multi-tenant uniqueness (member can only have one payment per month/year per admin)
paymentSchema.index({ memberId: 1, groupId: 1, month: 1, year: 1, adminId: 1 }, { unique: true })

// Index for multi-tenant queries
paymentSchema.index({ adminId: 1 })
paymentSchema.index({ groupId: 1 })
paymentSchema.index({ memberId: 1 })
paymentSchema.index({ month: 1, year: 1 })
paymentSchema.index({ status: 1 })

// Virtual for formatted payment date
paymentSchema.virtual('formattedPaymentDate').get(function() {
  return new Date(this.paymentDate).toLocaleDateString()
})

// Virtual for payment status color
paymentSchema.virtual('statusColor').get(function() {
  switch (this.status) {
    case 'PAID': return 'green'
    case 'PARTIAL': return 'orange'
    case 'PENDING': return 'yellow'
    case 'OVERDUE': return 'red'
    default: return 'gray'
  }
})

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)