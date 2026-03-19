import mongoose, { Document, Schema } from 'mongoose'

export interface IWithdrawal extends Document {
  memberId: string
  groupId: string
  adminId: string
  month: number
  year: number
  amount: number
  withdrawalDate: Date
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
  approvedBy?: string
  approvedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const withdrawalSchema = new Schema<IWithdrawal>({
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
    required: [true, 'Withdrawal amount is required'],
    min: 0
  },
  withdrawalDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  reason: {
    type: String,
    required: [true, 'Reason for withdrawal is required'],
    maxlength: 500
  },
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Compound index for multi-tenant uniqueness (member can only have one withdrawal per month/year per admin)
withdrawalSchema.index({ memberId: 1, groupId: 1, month: 1, year: 1, adminId: 1 }, { unique: true })

// Index for multi-tenant queries
withdrawalSchema.index({ adminId: 1 })
withdrawalSchema.index({ groupId: 1 })
withdrawalSchema.index({ memberId: 1 })
withdrawalSchema.index({ status: 1 })
withdrawalSchema.index({ withdrawalDate: 1 })

// Virtual for formatted withdrawal date
withdrawalSchema.virtual('formattedWithdrawalDate').get(function() {
  return new Date(this.withdrawalDate).toLocaleDateString()
})

// Virtual for withdrawal status color
withdrawalSchema.virtual('statusColor').get(function() {
  switch (this.status) {
    case 'APPROVED': return 'green'
    case 'PENDING': return 'yellow'
    case 'REJECTED': return 'red'
    default: return 'gray'
  }
})

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema)