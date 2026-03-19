import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, UserPlus, User, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface QuickAddMemberToGroupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
  groupName: string
}

interface FormData {
  name: string
  phoneNumber: string
}

export default function QuickAddMemberToGroup({ isOpen, onClose, onSuccess, groupId, groupName }: QuickAddMemberToGroupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      let memberId: string

      try {
        // Step 1: Try to create the member
        const memberRes = await axiosInstance.post('/members', data)
        memberId = memberRes.data.data._id
      } catch (createError: any) {
        // If member already exists, find them by phone number
        if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
          const membersRes = await axiosInstance.get('/members')
          const existing = (membersRes.data.data || []).find((m: any) => m.phoneNumber === data.phoneNumber)
          if (!existing) {
            toast.error('Member already exists but could not be found')
            return
          }
          memberId = existing._id
        } else {
          throw createError
        }
      }

      // Step 2: Add them to the group
      await axiosInstance.post(`/groups/${groupId}/members`, { memberId })

      toast.success('Member added to group successfully!')
      reset()
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Member</h2>
              <p className="text-sm text-gray-600">Adding to "{groupName}"</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Member Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name cannot exceed 50 characters' }
                })}
                type="text"
                id="name"
                className="input-field pl-10"
                placeholder="e.g., Ramesh Kumar"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('phoneNumber', {
                  required: 'Mobile number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' }
                })}
                type="tel"
                id="phoneNumber"
                className="input-field pl-10"
                placeholder="e.g., 9876543210"
                maxLength={10}
              />
            </div>
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
