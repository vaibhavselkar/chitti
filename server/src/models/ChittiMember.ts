import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IChittiMember extends Document {
  memberId: Types.ObjectId
  groupId: Types.ObjectId
  adminId: Types.ObjectId
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

const chittiMemberSchema = new Schema<IChittiMember>({
  memberId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Member ID is required'],
    ref: 'Member'
  },
  groupId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Group ID is required'],
    ref: 'ChittiGroup'
  },
  adminId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Admin ID is required'],
    ref: 'User'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for multi-tenant uniqueness (member can only be in a group once per admin)
chittiMemberSchema.index({ memberId: 1, groupId: 1, adminId: 1 }, { unique: true })

// Index for multi-tenant queries
chittiMemberSchema.index({ adminId: 1 })
chittiMemberSchema.index({ groupId: 1 })
chittiMemberSchema.index({ memberId: 1 })

export const ChittiMember = mongoose.model<IChittiMember>('ChittiMember', chittiMemberSchema)