import { useState } from 'react'
import { 
  MessageSquare, 
  Send, 
  Users, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface WhatsAppIntegrationProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string
  memberId?: string
  paymentId?: string
  withdrawalId?: string
  onSend: (type: string, data: any) => void
}

export default function WhatsAppIntegration({ 
  isOpen, 
  onClose, 
  groupId, 
  memberId, 
  paymentId, 
  withdrawalId, 
  onSend 
}: WhatsAppIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [bulkMembers, setBulkMembers] = useState<string[]>([])

  const handleSend = async (action: string) => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await axios.post(`/api/notifications/${action}`, {
      //   groupId,
      //   memberId,
      //   paymentId,
      //   withdrawalId,
      //   message: customMessage,
      //   memberIds: bulkMembers
      // })
      
      console.log('Sending WhatsApp message:', {
        action,
        groupId,
        memberId,
        paymentId,
        withdrawalId,
        message: customMessage,
        memberIds: bulkMembers
      })
      
      toast.success('WhatsApp message sent successfully!')
      onSend(action, {
        groupId,
        memberId,
        paymentId,
        withdrawalId,
        message: customMessage,
        memberIds: bulkMembers
      })
      onClose()
    } catch (error: any) {
      console.error('Send WhatsApp message error:', error)
      toast.error('Failed to send WhatsApp message')
    } finally {
      setIsLoading(false)
    }
  }

  const getActionOptions = () => {
    if (paymentId) {
      return [
        { value: 'payments/reminder', label: 'Send Payment Reminder', icon: DollarSign, color: 'text-yellow-600' },
        { value: 'payments/confirmation', label: 'Send Payment Confirmation', icon: CheckCircle, color: 'text-green-600' }
      ]
    } else if (withdrawalId) {
      return [
        { value: 'withdrawals/request', label: 'Send Withdrawal Request Notification', icon: Calendar, color: 'text-blue-600' },
        { value: 'withdrawals/approve', label: 'Send Withdrawal Approval', icon: CheckCircle, color: 'text-green-600' },
        { value: 'withdrawals/reject', label: 'Send Withdrawal Rejection', icon: XCircle, color: 'text-red-600' }
      ]
    } else if (memberId) {
      return [
        { value: 'groups/invite', label: 'Send Group Invitation', icon: Users, color: 'text-green-600' },
        { value: 'payments/reminder', label: 'Send Payment Reminder', icon: DollarSign, color: 'text-yellow-600' }
      ]
    } else if (groupId) {
      return [
        { value: 'groups/reminders', label: 'Send Bulk Payment Reminders', icon: Users, color: 'text-blue-600' },
        { value: 'payments/reminder', label: 'Send Payment Reminder', icon: DollarSign, color: 'text-yellow-600' }
      ]
    }
    return []
  }

  const ActionIcon = selectedAction ? getActionOptions().find(opt => opt.value === selectedAction)?.icon : MessageSquare

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                WhatsApp Integration
              </h2>
              <p className="text-sm text-gray-600">
                Send messages via WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Action
            </label>
            <div className="grid grid-cols-1 gap-2">
              {getActionOptions().map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedAction(option.value)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedAction === option.value 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <option.icon className={`h-5 w-5 ${option.color}`} />
                    <div>
                      <div className="font-medium">{option.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          {selectedAction && (
            <div>
              <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Add a custom message or leave empty for default template..."
              />
              <p className="mt-1 text-xs text-gray-600">
                Default templates will be used if no custom message is provided
              </p>
            </div>
          )}

          {/* Bulk Members Selection (for bulk reminders) */}
          {selectedAction === 'groups/reminders' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members
              </label>
              <div className="space-y-2">
                {['Member 1', 'Member 2', 'Member 3', 'Member 4'].map((member, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkMembers.includes(member)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkMembers([...bulkMembers, member])
                        } else {
                          setBulkMembers(bulkMembers.filter(m => m !== member))
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{member}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Select members to send bulk payment reminders
              </p>
            </div>
          )}

          {/* WhatsApp Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">WhatsApp Service Status</h3>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 mt-2">
              <li>• Service: <span className="font-medium">Connected</span></li>
              <li>• Account: <span className="font-medium">Twilio</span></li>
              <li>• Number: <span className="font-medium">+1234567890</span></li>
              <li>• Messages sent today: <span className="font-medium">15</span></li>
            </ul>
          </div>

          {/* Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <h3 className="text-sm font-medium text-yellow-900">Important Notes:</h3>
            </div>
            <ul className="text-sm text-yellow-800 space-y-1 mt-2">
              <li>• WhatsApp messages require Twilio account setup</li>
              <li>• Messages are sent in real-time</li>
              <li>• Recipients must have WhatsApp installed</li>
              <li>• Message templates must be approved by WhatsApp</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSend(selectedAction)}
            disabled={isLoading || !selectedAction}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>
              {isLoading ? 'Sending...' : selectedAction ? 'Send Message' : 'Select Action First'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}