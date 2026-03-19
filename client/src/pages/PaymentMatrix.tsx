import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Edit, 
  DollarSign, 
  Users, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentForm from '../components/PaymentForm'

interface Payment {
  _id: string
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE'
  paymentDate: string
  transactionId?: string
  notes?: string
}

interface Member {
  memberId: string
  memberName: string
  phoneNumber: string
  payment: Payment | null
}

interface Group {
  _id: string
  name: string
  monthlyContribution: number
}

export default function PaymentMatrix() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [group, setGroup] = useState<Group | null>(null)
  const [matrixData, setMatrixData] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    if (groupId) {
      fetchGroupInfo()
      fetchPaymentMatrix()
    }
  }, [groupId, selectedMonth, selectedYear])

  const fetchGroupInfo = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/groups/${groupId}`)
      // setGroup(response.data.data)
      
      // Mock data for now
      setGroup({
        _id: groupId!,
        name: 'Monthly Chitti - January 2024',
        monthlyContribution: 5000
      })
    } catch (error) {
      console.error('Error fetching group info:', error)
      toast.error('Failed to load group information')
    }
  }

  const fetchPaymentMatrix = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/groups/${groupId}/payments/matrix?month=${selectedMonth}&year=${selectedYear}`)
      // setMatrixData(response.data.data)
      
      // Mock data for now
      setMatrixData([
        {
          memberId: '1',
          memberName: 'Ramesh Kumar',
          phoneNumber: '9876543210',
          payment: {
            _id: '1',
            amount: 5000,
            status: 'PAID',
            paymentMethod: 'CASH',
            paymentDate: '2024-01-15T10:00:00Z',
            transactionId: 'TXN001',
            notes: 'On time payment'
          }
        },
        {
          memberId: '2',
          memberName: 'Suresh Patel',
          phoneNumber: '8765432109',
          payment: {
            _id: '2',
            amount: 5000,
            status: 'PENDING',
            paymentMethod: 'CASH',
            paymentDate: '2024-01-15T10:00:00Z',
            notes: 'Will pay next week'
          }
        },
        {
          memberId: '3',
          memberName: 'Amit Singh',
          phoneNumber: '7654321098',
          payment: {
            _id: '3',
            amount: 5000,
            status: 'OVERDUE',
            paymentMethod: 'UPI',
            paymentDate: '2024-01-15T10:00:00Z',
            transactionId: 'TXN003',
            notes: 'Late payment'
          }
        }
      ])
    } catch (error) {
      console.error('Error fetching payment matrix:', error)
      toast.error('Failed to load payment matrix')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPayment = (member: Member) => {
    setSelectedMember(member)
    setShowPaymentModal(true)
  }

  const handleUpdatePayment = (member: Member) => {
    setSelectedMember(member)
    setShowPaymentModal(true)
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
      case 'PAID': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'OVERDUE': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <DollarSign className="h-4 w-4" />
      case 'BANK_TRANSFER': return <CreditCard className="h-4 w-4" />
      case 'UPI': return <CreditCard className="h-4 w-4" />
      case 'CHEQUE': return <CreditCard className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const filteredData = matrixData.filter(member =>
    member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNumber.includes(searchTerm)
  )

  const summary = {
    totalMembers: matrixData.length,
    paidMembers: matrixData.filter(m => m.payment?.status === 'PAID').length,
    pendingMembers: matrixData.filter(m => m.payment?.status === 'PENDING').length,
    overdueMembers: matrixData.filter(m => m.payment?.status === 'OVERDUE').length,
    totalAmount: matrixData.reduce((sum, m) => sum + (m.payment?.amount || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
          <p className="text-gray-600 mb-8">The group you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBack}
            className="btn-primary"
          >
            Back to Groups
          </button>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Payment Matrix</h1>
              <p className="text-gray-600 mt-1">Manage payments for {group.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Monthly Contribution</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(group.monthlyContribution)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Period</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalMembers}</p>
            </div>
            <Users className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{summary.paidMembers}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pendingMembers}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{summary.overdueMembers}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search members by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Payment Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payment Status</h2>
            <div className="text-sm text-gray-600">
              {filteredData.length} members
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((member) => (
                <tr key={member.memberId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.memberName}</div>
                        <div className="text-sm text-gray-500">Member ID: {member.memberId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPhoneNumber(member.phoneNumber)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {member.payment ? getStatusIcon(member.payment.status) : <Clock className="h-5 w-5 text-gray-400" />}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.payment ? getStatusColor(member.payment.status) : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.payment ? member.payment.status : 'NO PAYMENT'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.payment ? formatCurrency(member.payment.amount) : formatCurrency(group.monthlyContribution)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.payment ? (
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(member.payment.paymentMethod)}
                        <span className="text-sm text-gray-900">{member.payment.paymentMethod}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not paid</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {member.payment ? (
                      <button
                        onClick={() => handleUpdatePayment(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddPayment(member)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Payment</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}