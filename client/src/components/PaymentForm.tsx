import { useState } from 'react'
import { X, DollarSign, Calendar, CreditCard, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  memberName: string
  phoneNumber: string
  monthlyContribution: number
  groupId: string
  memberId: string
  existingPayment?: {
    _id: string
    amount: number
    status: 'PAID' | 'PENDING' | 'OVERDUE'
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE'
    transactionId?: string
    notes?: string
  } | null
}

export default function PaymentForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  memberName, 
  phoneNumber, 
  monthlyContribution, 
  groupId, 
  memberId,
  existingPayment 
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: existingPayment?.amount || monthlyContribution,
    status: existingPayment?.status || 'PAID',
    paymentMethod: existingPayment?.paymentMethod || 'CASH',
    transactionId: existingPayment?.transactionId || '',
    notes: existingPayment?.notes || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await axios.post('/api/payments', {
      //   memberId,
      //   groupId,
      //   month: new Date().getMonth() + 1,
      //   year: new Date().getFullYear(),
      //   ...formData
      // })
      
      console.log('Creating/updating payment:', {
        memberId,
        groupId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        ...formData
      })
      
      toast.success(existingPayment ? 'Payment updated successfully!' : 'Payment added successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating/updating payment:', error)
      toast.error(error.response?.data?.message || 'Failed to save payment')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2$3')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {existingPayment ? 'Update Payment' : 'Add Payment'}
              </h2>
              <p className="text-sm text-gray-600">For {memberName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Member Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{memberName}</div>
              <div className="text-sm text-gray-600">{formatPhoneNumber(phoneNumber)}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="input-field pl-10"
                min="0"
                step="0.01"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Monthly contribution: {formatCurrency(monthlyContribution)}
            </p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="transactionId"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleInputChange}
                className="input-field pl-10"
                placeholder="e.g., TXN123456789"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Any additional notes about this payment..."
            />
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Payment Details:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Payment period: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</li>
              <li>• Member: {memberName}</li>
              <li>• Status will be automatically set based on your selection</li>
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
                  <span>{existingPayment ? 'Updating...' : 'Adding...'}</span>
                </div>
              ) : (
                existingPayment ? 'Update Payment' : 'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}