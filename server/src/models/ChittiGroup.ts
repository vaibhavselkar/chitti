import mongoose, { Document, Schema } from 'mongoose'
import { IUser } from './User'

export interface IChittiGroup extends Document {
  name: string
  totalMembers: number
  monthlyAmount: number
  totalMonths: number
  collectionDay: number
  startDate: Date
  status: 'OPEN' | 'FULL'
  adminId: string
  createdAt: Date
  updatedAt: Date
}

const chittiGroupSchema = new Schema<IChittiGroup>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  totalMembers: {
    type: Number,
    required: [true, 'Total members is required'],
    min: [3, 'Minimum 3 members required'],
    max: [50, 'Maximum 50 members allowed']
  },
  monthlyAmount: {
    type: Number,
    required: [true, 'Monthly amount is required'],
    min: [100, 'Minimum monthly amount is ₹100']
  },
  totalMonths: {
    type: Number,
    required: [true, 'Total months is required'],
    min: [6, 'Minimum 6 months required'],
    max: [60, 'Maximum 60 months allowed']
  },
  collectionDay: {
    type: Number,
    required: [true, 'Collection day is required'],
    min: [1, 'Collection day must be between 1 and 31'],
    max: [31, 'Collection day must be between 1 and 31']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  status: {
    type: String,
    enum: ['OPEN', 'FULL'],
    default: 'OPEN'
  },
  adminId: {
    type: String,
    required: [true, 'Admin ID is required'],
    ref: 'User'
  }
}, {
  timestamps: true
})

// Index for multi-tenant queries
chittiGroupSchema.index({ adminId: 1 })

// Virtual for current members count
chittiGroupSchema.virtual('currentMembers').get(function() {
  // This would be populated by counting members in the group
  // Implementation depends on how we link members to groups
  return 0
})

// Virtual for end date
chittiGroupSchema.virtual('endDate').get(function() {
  const endDate = new Date(this.startDate)
  endDate.setMonth(endDate.getMonth() + this.totalMonths)
  return endDate
})

// Virtual for total collection amount
chittiGroupSchema.virtual('totalCollection').get(function() {
  return this.totalMembers * this.monthlyAmount * this.totalMonths
})

export const ChittiGroup = mongoose.model<IChittiGroup>('ChittiGroup', chittiGroupSchema)