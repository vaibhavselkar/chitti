import mongoose, { Document, Schema } from 'mongoose'

export interface IMember extends Document {
  name: string
  phoneNumber: string
  adminId: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

const memberSchema = new Schema<IMember>({
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  adminId: {
    type: String,
    required: [true, 'Admin ID is required']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  }
}, {
  timestamps: true
})

// Compound index for multi-tenant uniqueness
memberSchema.index({ phoneNumber: 1, adminId: 1 }, { unique: true })

// Index for multi-tenant queries
memberSchema.index({ adminId: 1 })

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
  return this.name
})

export const Member = mongoose.model<IMember>('Member', memberSchema)