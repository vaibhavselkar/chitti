import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Users, User, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface CreateMemberProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  phoneNumber: string
  address?: string
}

export default function CreateMember({ isOpen, onClose, onSuccess }: CreateMemberProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await axiosInstance.post('/members', data)
      toast.success('Member created successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create member')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add New Member</h2>
              <p className="text-sm text-gray-600">Add a member to your Chitti groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Member Name */}
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
                  required: 'Member name is required',
                  minLength: {
                    value: 2,
                    message: 'Member name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Member name cannot exceed 50 characters'
                  }
                })}
                type="text"
                id="name"
                className="input-field pl-10"
                placeholder="e.g., Ramesh Kumar"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Please enter a valid Indian phone number'
                  }
                })}
                type="tel"
                id="phoneNumber"
                className="input-field pl-10"
                placeholder="e.g., 9876543210"
                maxLength={10}
              />
            </div>
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('address', {
                  maxLength: { value: 200, message: 'Address cannot exceed 200 characters' }
                })}
                type="text"
                id="address"
                className="input-field pl-10"
                placeholder="e.g., Hyderabad, Telangana"
              />
            </div>
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Phone numbers must be unique per admin</li>
              <li>• Only Indian phone numbers are accepted</li>
              <li>• Members can be added to multiple groups</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
                  <span>Creating...</span>
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