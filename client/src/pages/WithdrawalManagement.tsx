import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import WithdrawalForm from '../components/WithdrawalForm'

interface Withdrawal {
  _id: string
  memberId: string
  groupId: string
  amount: number
  withdrawalDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  memberName: string
  phoneNumber: string
  groupName: string
}

export default function WithdrawalManagement() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState(groupId ? 'GROUP' : 'ALL')
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [filterType, filterStatus])

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/withdrawals?type=${filterType}&status=${filterStatus}${groupId ? `&groupId=${groupId}` : ''}`)
      // setWithdrawals(response.data.data)
      
      // Mock data for now
      setWithdrawals([
        {
          _id: '1',
          memberId: '1',
          groupId: '1',
          amount: 10000,
          withdrawalDate: '2024-01-15T10:00:00Z',
          status: 'PENDING',
          reason: 'Medical emergency requiring immediate funds',
          notes: 'Approved for medical treatment',
          memberName: 'Ramesh Kumar',
          phoneNumber: '9876543210',
          groupName: 'Monthly Chitti - January 2024'
        },
        {
          _id: '2',
          memberId: '2',
          groupId: '1',
          amount: 15000,
          withdrawalDate: '2024-01-10T10:00:00Z',
          status: 'APPROVED',
          reason: 'House renovation expenses',
          approvedBy: user?._id,
          approvedAt: '2024-01-12T10:00:00Z',
          notes: 'Approved with conditions',
          memberName: 'Suresh Patel',
          phoneNumber: '8765432109',
          groupName: 'Monthly Chitti - January 2024'
        },
        {
          _id: '3',
          memberId: '3',
          groupId: '1',
          amount: 5000,
          withdrawalDate: '2024-01-05T10:00:00Z',
          status: 'REJECTED',
          reason: 'Insufficient balance in account',
          approvedBy: user?._id,
          approvedAt: '2024-01-06T10:00:00Z',
          notes: 'Member needs to clear dues first',
          memberName: 'Amit Singh',
          phoneNumber: '7654321098',
          groupName: 'Monthly Chitti - January 2024'
        }
      ])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast.error('Failed to load withdrawals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWithdrawal = () => {
    setSelectedWithdrawal(null)
    setShowWithdrawalModal(true)
  }

  const handleEditWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowWithdrawalModal(true)
  }

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      // TODO: Replace with actual API call
      // await axios.put(`/api/withdrawals/${withdrawalId}/approve`)
      
      console.log('Approving withdrawal:', withdrawalId)
      toast.success('Withdrawal approved successfully!')
      fetchWithdrawals()
    } catch (error: any) {
      console.error('Error approving withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
    }
  }

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      // TODO: Replace with actual API call
      // await axios.put(`/api/withdrawals/${withdrawalId}/reject`)
      
      console.log('Rejecting withdrawal:', withdrawalId)
      toast.success('Withdrawal rejected successfully!')
      fetchWithdrawals()
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal')
    }
  }

  const handleDeleteWithdrawal = async (withdrawalId: string) => {
    try {
      // TODO: Replace with actual API call
      // await axios.delete(`/api/withdrawals/${withdrawalId}`)
      
      console.log('Deleting withdrawal:', withdrawalId)
      toast.success('Withdrawal deleted successfully!')
      fetchWithdrawals()
    } catch (error: any) {
      console.error('Error deleting withdrawal:', error)
      toast.error(error.response?.data?.message || 'Failed to delete withdrawal')
    }
  }

  const handleBack = () => {
    navigate('/groups')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    (withdrawal.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     withdrawal.phoneNumber.includes(searchTerm) ||
     withdrawal.reason.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'ALL' || withdrawal.status === filterStatus)
  )

  const summary = {
    totalWithdrawals: withdrawals.length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingWithdrawals: withdrawals.filter(w => w.status === 'PENDING').length,
    approvedWithdrawals: withdrawals.filter(w => w.status === 'APPROVED').length,
    rejectedWithdrawals: withdrawals.filter(w => w.status === 'REJECTED').length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
              <p className="text-gray-600 mt-1">Manage member withdrawal requests</p>
            </div>
          </div>
          <button
            onClick={handleCreateWithdrawal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalWithdrawals}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pendingWithdrawals}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{summary.approvedWithdrawals}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{summary.rejectedWithdrawals}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by member name, phone, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h2>
            <div className="text-sm text-gray-600">
              {filteredWithdrawals.length} requests
            </div>
          </div>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'No withdrawal requests have been made yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateWithdrawal}
                className="btn-primary"
              >
                Create New Withdrawal
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.memberName}</div>
                          <div className="text-sm text-gray-500">{formatPhoneNumber(withdrawal.phoneNumber)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{withdrawal.groupName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.withdrawalDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {withdrawal.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(withdrawal._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEditWithdrawal(withdrawal)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {withdrawal.status === 'PENDING' && (
                        <button
                          onClick={() => handleDeleteWithdrawal(withdrawal._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}