import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Calendar, Users, DollarSign, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface CreateGroupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  totalMembers: number
  monthlyAmount: number
  totalMonths: number
  collectionDay: number
  startDate: string
}

export default function CreateGroup({ isOpen, onClose, onSuccess }: CreateGroupProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      totalMembers: 10,
      monthlyAmount: 1000,
      totalMonths: 12,
      collectionDay: 25,
      startDate: new Date().toISOString().split('T')[0]
    }
  })

  const totalMembers = watch('totalMembers')
  const monthlyAmount = watch('monthlyAmount')
  const totalMonths = watch('totalMonths')

  const totalCollection = totalMembers * monthlyAmount * totalMonths

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await axiosInstance.post('/groups', data)
      toast.success('Group created successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Chitti Group</h2>
              <p className="text-sm text-gray-600">Set up your group details</p>
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
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              {...register('name', {
                required: 'Group name is required',
                minLength: {
                  value: 2,
                  message: 'Group name must be at least 2 characters'
                },
                maxLength: {
                  value: 100,
                  message: 'Group name cannot exceed 100 characters'
                }
              })}
              type="text"
              id="name"
              className="input-field"
              placeholder="e.g., Monthly Savings Group"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Basic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Members */}
            <div>
              <label htmlFor="totalMembers" className="block text-sm font-medium text-gray-700 mb-2">
                Total Members
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('totalMembers', {
                    required: 'Total members is required',
                    valueAsNumber: true,
                    min: {
                      value: 3,
                      message: 'Minimum 3 members required'
                    },
                    max: {
                      value: 50,
                      message: 'Maximum 50 members allowed'
                    }
                  })}
                  type="number"
                  id="totalMembers"
                  className="input-field pl-10"
                  min="3"
                  max="50"
                  step="1"
                />
              </div>
              {errors.totalMembers && (
                <p className="mt-1 text-sm text-red-600">{errors.totalMembers.message}</p>
              )}
            </div>

            {/* Monthly Amount */}
            <div>
              <label htmlFor="monthlyAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('monthlyAmount', {
                    required: 'Monthly amount is required',
                    valueAsNumber: true,
                    min: {
                      value: 100,
                      message: 'Minimum monthly amount is ₹100'
                    }
                  })}
                  type="number"
                  id="monthlyAmount"
                  className="input-field pl-10"
                  min="100"
                  step="100"
                />
              </div>
              {errors.monthlyAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyAmount.message}</p>
              )}
            </div>

            {/* Total Months */}
            <div>
              <label htmlFor="totalMonths" className="block text-sm font-medium text-gray-700 mb-2">
                Total Months
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('totalMonths', {
                    required: 'Total months is required',
                    valueAsNumber: true,
                    min: {
                      value: 6,
                      message: 'Minimum 6 months required'
                    },
                    max: {
                      value: 60,
                      message: 'Maximum 60 months allowed'
                    }
                  })}
                  type="number"
                  id="totalMonths"
                  className="input-field pl-10"
                  min="6"
                  max="60"
                  step="1"
                />
              </div>
              {errors.totalMonths && (
                <p className="mt-1 text-sm text-red-600">{errors.totalMonths.message}</p>
              )}
            </div>

            {/* Collection Day */}
            <div>
              <label htmlFor="collectionDay" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Date of Month
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('collectionDay', {
                    required: 'Collection day is required',
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: 'Collection day must be between 1 and 31'
                    },
                    max: {
                      value: 31,
                      message: 'Collection day must be between 1 and 31'
                    }
                  })}
                  type="number"
                  id="collectionDay"
                  className="input-field pl-10"
                  min="1"
                  max="31"
                  step="1"
                />
              </div>
              {errors.collectionDay && (
                <p className="mt-1 text-sm text-red-600">{errors.collectionDay.message}</p>
              )}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('startDate', {
                  required: 'Start date is required',
                  valueAsDate: true
                })}
                type="date"
                id="startDate"
                className="input-field pl-10"
              />
            </div>
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Group Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Members:</span>
                <span className="ml-2 font-medium">{totalMembers}</span>
              </div>
              <div>
                <span className="text-gray-600">Monthly Amount:</span>
                <span className="ml-2 font-medium">₹{monthlyAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Months:</span>
                <span className="ml-2 font-medium">{totalMonths}</span>
              </div>
              <div className="md:col-span-3 pt-2 border-t border-gray-200">
                <span className="text-gray-600">Total Collection:</span>
                <span className="ml-2 font-bold text-lg text-primary-600">
                  ₹{totalCollection.toLocaleString()}
                </span>
              </div>
            </div>
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
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}