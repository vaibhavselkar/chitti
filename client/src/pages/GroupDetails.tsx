import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, Plus, Trash2, Search, Calendar,
  Phone, User as UserIcon, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertCircle, X, Banknote, MessageSquare, CheckSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import QuickAddMemberToGroup from '../components/QuickAddMemberToGroup'
import axiosInstance from '../lib/axiosInstance'

interface Member {
  _id: string
  memberId: string
  name: string
  phoneNumber: string
  chittiCount: number
  joinedAt: string
}

interface Payment {
  _id: string
  memberId: string | { _id: string }
  amount: number
  paidAmount?: number
  month: number
  year: number
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'
}

interface Withdrawal {
  _id: string
  memberId: string | { _id: string }
  amount: number
  month: number
  year: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface Group {
  _id: string
  name: string
  totalMembers: number
  monthlyAmount: number
  totalMonths: number
  startDate: string
  status: 'OPEN' | 'FULL'
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMemberId(raw: string | { _id: string }): string {
  return typeof raw === 'string' ? raw : raw._id
}

export default function GroupDetails() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [withdrawModal, setWithdrawModal] = useState<Member | null>(null)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', reason: '' })
  const [withdrawing, setWithdrawing] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [partialModal, setPartialModal] = useState<Member | null>(null)
  const [partialAmount, setPartialAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'payments' | 'withdrawals'>('payments')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [markAllConfirm, setMarkAllConfirm] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const fetchAll = useCallback(async () => {
    if (!groupId) return
    try {
      setIsLoading(true)
      const [groupRes, membersRes] = await Promise.all([
        axiosInstance.get(`/groups/${groupId}`),
        axiosInstance.get(`/groups/${groupId}/members`)
      ])
      setGroup(groupRes.data.data)
      setMembers(membersRes.data.data || [])

      // Non-critical - don't fail if these error
      try {
        const paymentsRes = await axiosInstance.get(`/payments/groups/${groupId}`)
        setAllPayments(paymentsRes.data.data || [])
      } catch { setAllPayments([]) }

      try {
        const withdrawalsRes = await axiosInstance.get(`/withdrawals/groups/${groupId}`)
        setWithdrawals(withdrawalsRes.data.data || [])
      } catch { setWithdrawals([]) }

    } catch {
      toast.error('Failed to load group data')
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const shiftMonth = (delta: number) => {
    let m = selectedMonth + delta
    let y = selectedYear
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setSelectedMonth(m)
    setSelectedYear(y)
  }

  // ── Payment helpers ──────────────────────────────────────────
  const getMemberPayments = (memberId: string) =>
    allPayments.filter(p => getMemberId(p.memberId) === memberId)

  const getThisMonthPayment = (memberId: string) =>
    getMemberPayments(memberId).find(
      p => p.month === selectedMonth && p.year === selectedYear
    ) ?? null

  const getTotalPaidMonths = (memberId: string) =>
    getMemberPayments(memberId).filter(p => p.status === 'PAID').length

  // Months elapsed from group start to selected month (exclusive of selected month)
  const getMonthsElapsed = (startDate: string) => {
    const s = new Date(startDate)
    const elapsed = (selectedYear - s.getFullYear()) * 12 + (selectedMonth - (s.getMonth() + 1))
    return Math.max(0, elapsed)
  }

  // Color logic
  type RowColor = 'green' | 'orange' | 'black'
  const getRowColor = (member: Member): RowColor => {
    const payment = getThisMonthPayment(member.memberId)
    if (payment?.status === 'PAID') return 'green'
    if (payment?.status === 'PARTIAL') return 'orange'
    const totalPaid = getTotalPaidMonths(member.memberId)
    const elapsed = group ? getMonthsElapsed(group.startDate) : 0
    // If they've missed multiple past months → black
    if (elapsed > 0 && totalPaid < elapsed - 1) return 'black'
    return 'orange'
  }

  // ── Withdrawal helpers ───────────────────────────────────────
  const getMemberWithdrawal = (memberId: string) =>
    withdrawals.find(w => getMemberId(w.memberId) === memberId) ?? null

  const poolAmount = group ? group.totalMembers * group.monthlyAmount : 0

  const handleMarkPaid = async (member: Member) => {
    if (!group) return
    setMarkingPaid(member.memberId)
    try {
      await axiosInstance.post('/payments', {
        memberId: member.memberId,
        groupId,
        month: selectedMonth,
        year: selectedYear,
        amount: group.monthlyAmount * (member.chittiCount || 1),
        status: 'PAID',
        paymentMethod: 'CASH'
      })
      toast.success(`Payment marked for ${member.name}`)
      fetchAll()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment')
    } finally {
      setMarkingPaid(null)
    }
  }

  const handlePartialPayment = async () => {
    if (!partialModal || !group || !partialAmount) return
    try {
      await axiosInstance.post('/payments', {
        memberId: partialModal.memberId,
        groupId,
        month: selectedMonth,
        year: selectedYear,
        amount: group.monthlyAmount * (partialModal.chittiCount || 1),
        paidAmount: Number(partialAmount),
        paymentMethod: 'CASH'
      })
      toast.success(`Partial payment of ₹${partialAmount} recorded for ${partialModal.name}`)
      setPartialModal(null)
      setPartialAmount('')
      fetchAll()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment')
    }
  }

  const openWithdrawModal = (member: Member) => {
    setWithdrawForm({ amount: String(poolAmount), reason: '' })
    setWithdrawModal(member)
  }

  const handleWithdraw = async () => {
    if (!withdrawModal || !group) return
    if (withdrawForm.reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters')
      return
    }
    setWithdrawing(true)
    try {
      await axiosInstance.post('/withdrawals', {
        memberId: withdrawModal.memberId,
        groupId,
        month: selectedMonth,
        year: selectedYear,
        amount: Number(withdrawForm.amount),
        reason: withdrawForm.reason.trim()
      })
      toast.success(`Withdrawal recorded for ${withdrawModal.name}`)
      setWithdrawModal(null)
      fetchAll()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record withdrawal')
    } finally {
      setWithdrawing(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setConfirmRemoveId(memberId)
  }

  const doRemoveMember = async () => {
    if (!confirmRemoveId) return
    try {
      await axiosInstance.delete(`/groups/${groupId}/members/${confirmRemoveId}`)
      toast.success('Member removed')
      setConfirmRemoveId(null)
      fetchAll()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleMarkAllPaid = async () => {
    if (!group) return
    const unpaid = members.filter(m => {
      const pay = getThisMonthPayment(m.memberId)
      return !pay || (pay.status !== 'PAID' && pay.status !== 'PARTIAL')
    })
    if (unpaid.length === 0) {
      toast.success('All members already paid!')
      setMarkAllConfirm(false)
      return
    }
    setMarkingAll(true)
    try {
      await Promise.all(unpaid.map(member =>
        axiosInstance.post('/payments', {
          memberId: member.memberId,
          groupId,
          month: selectedMonth,
          year: selectedYear,
          amount: group.monthlyAmount * (member.chittiCount || 1),
          status: 'PAID',
          paymentMethod: 'CASH'
        })
      ))
      toast.success(`Marked ${unpaid.length} member${unpaid.length !== 1 ? 's' : ''} as paid`)
      setMarkAllConfirm(false)
      fetchAll()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark all paid')
    } finally {
      setMarkingAll(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const filteredMembers = members
    .filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phoneNumber.includes(searchTerm)
    )
    .sort((a, b) => {
      const order = (m: Member) => {
        const pay = getThisMonthPayment(m.memberId)
        if (!pay || pay.status === 'PENDING' || pay.status === 'OVERDUE') return 0
        if (pay.status === 'PARTIAL') return 1
        return 2
      }
      return order(a) - order(b)
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
        <button onClick={() => navigate('/groups')} className="btn-primary">Back to Groups</button>
      </div>
    )
  }

  const slotsRemaining = group.totalMembers - members.length
  const capacityPercent = Math.round((members.length / group.totalMembers) * 100)
  const isFull = slotsRemaining <= 0

  const paidThisMonth = filteredMembers.filter(m => getThisMonthPayment(m.memberId)?.status === 'PAID').length
  const collectedThisMonth = filteredMembers
    .filter(m => getThisMonthPayment(m.memberId)?.status === 'PAID')
    .reduce((sum, m) => sum + group.monthlyAmount * (m.chittiCount || 1), 0)
  const pendingThisMonth = filteredMembers.filter(m => {
    const pay = getThisMonthPayment(m.memberId)
    return !pay || (pay.status !== 'PAID' && pay.status !== 'PARTIAL')
  }).length

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/groups')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {isFull ? 'FULL' : 'OPEN'}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started {new Date(group.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-500">Monthly</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(group.monthlyAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Pool / Month</div>
              <div className="text-lg font-bold text-primary-700">{formatCurrency(poolAmount)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Members</div>
              <div className="text-lg font-bold text-gray-900">{members.length}/{group.totalMembers}</div>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              disabled={isFull}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /><span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{members.length} joined</span>
            <span>{isFull ? 'Group full' : `${slotsRemaining} slot${slotsRemaining !== 1 ? 's' : ''} open`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${isFull ? 'bg-red-500' : capacityPercent >= 80 ? 'bg-orange-400' : 'bg-green-500'}`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Members & Payments
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'withdrawals' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Withdrawals {withdrawals.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{withdrawals.length}</span>}
          </button>
        </div>

        {activeTab === 'withdrawals' ? (
          /* ── Withdrawals Tab ── */
          <div>
            {withdrawals.length === 0 ? (
              <div className="py-16 text-center">
                <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No withdrawals recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the "Withdraw" button in the Payments tab to record a withdrawal</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Member', 'Month', 'Received', 'Total Paid In', 'Profit / Loss', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawals.map(w => {
                      const wMemberId = getMemberId(w.memberId)
                      const member = members.find(m => m.memberId === wMemberId)
                      // Total amount paid IN by this member across all months
                      const totalPaidIn = allPayments
                        .filter(p => getMemberId(p.memberId) === wMemberId)
                        .reduce((sum, p) => {
                          if (p.status === 'PAID') return sum + p.amount
                          if (p.status === 'PARTIAL') return sum + (p.paidAmount ?? 0)
                          return sum
                        }, 0)
                      const profit = totalPaidIn - w.amount
                      return (
                        <tr key={w._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{member?.name ?? '—'}</div>
                            <div className="text-xs text-gray-500">{member?.phoneNumber ?? ''}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">{MONTH_SHORT[w.month - 1]} {w.year}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(w.amount)}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{formatCurrency(totalPaidIn)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              w.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                              : w.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ── Payments Tab ── */
          <>
        {/* Table toolbar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment status for each member</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mark All Paid */}
              {pendingThisMonth > 0 && (
                <button
                  onClick={() => setMarkAllConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5" /> Mark All Paid
                </button>
              )}
              {/* Month nav */}
              <div className="flex items-center space-x-1">
                <button onClick={() => shiftMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="px-4 py-1.5 bg-primary-50 rounded-lg text-sm font-semibold text-primary-700 min-w-[120px] text-center">
                  {MONTH_SHORT[selectedMonth - 1]} {selectedYear}
                </div>
                <button onClick={() => shiftMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary chips */}
          {members.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full text-xs font-medium text-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> {paidThisMonth} Paid
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-full text-xs font-medium text-orange-700">
                <Clock className="h-3.5 w-3.5" /> {pendingThisMonth} Pending
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full text-xs font-medium text-purple-700">
                <Banknote className="h-3.5 w-3.5" />
                Collected: {formatCurrency(collectedThisMonth)}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Paid this month</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />Not paid / partial this month</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-800 inline-block" />Multiple months overdue</span>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        {filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? 'No members match your search' : 'No members yet — add the first one!'}
            </p>
            {!searchTerm && !isFull && (
              <button onClick={() => setShowAddMemberModal(true)} className="btn-primary mt-4">Add Member</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Member', 'Total Paid', 'This Month', 'Withdrawal', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member, idx) => {
                  const color = getRowColor(member)
                  const thisMonthPay = getThisMonthPayment(member.memberId)
                  const totalPaid = getTotalPaidMonths(member.memberId)
                  const withdrawal = getMemberWithdrawal(member.memberId)

                  const rowBg = color === 'green'
                    ? 'bg-green-50 border-l-4 border-l-green-500'
                    : color === 'black'
                      ? 'bg-gray-900 border-l-4 border-l-gray-700'
                      : 'bg-orange-50 border-l-4 border-l-orange-400'

                  const textColor = color === 'black' ? 'text-white' : 'text-gray-900'
                  const subTextColor = color === 'black' ? 'text-gray-400' : 'text-gray-500'

                  return (
                    <tr key={member._id} className={`${rowBg} hover:opacity-95 transition-opacity`}>
                      {/* # */}
                      <td className={`px-4 py-4 text-sm ${subTextColor} w-10`}>{idx + 1}</td>

                      {/* Member */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            color === 'green' ? 'bg-green-100' : color === 'black' ? 'bg-gray-700' : 'bg-orange-100'
                          }`}>
                            <UserIcon className={`h-5 w-5 ${
                              color === 'green' ? 'text-green-600' : color === 'black' ? 'text-gray-300' : 'text-orange-500'
                            }`} />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${textColor}`}>{member.name}</div>
                            <div className={`flex items-center text-xs mt-0.5 ${subTextColor}`}>
                              <Phone className="h-3 w-3 mr-1" />{member.phoneNumber}
                            </div>
                            {member.chittiCount > 1 && (
                              <div className="flex items-center text-xs mt-0.5 font-semibold text-purple-600">
                                ×{member.chittiCount} chitti · {formatCurrency(group.monthlyAmount * member.chittiCount)}/mo
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${textColor}`}>{totalPaid}
                          <span className={`font-normal text-xs ml-1 ${subTextColor}`}>/ {group.totalMonths} months</span>
                        </div>
                        {/* Mini progress */}
                        <div className="w-20 bg-gray-300 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${color === 'black' ? 'bg-gray-400' : 'bg-primary-500'}`}
                            style={{ width: `${Math.round((totalPaid / group.totalMonths) * 100)}%` }}
                          />
                        </div>
                      </td>

                      {/* This Month */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {thisMonthPay?.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="h-3.5 w-3.5" /> Paid · {formatCurrency(thisMonthPay.amount)}
                          </span>
                        ) : thisMonthPay?.status === 'PARTIAL' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Clock className="h-3.5 w-3.5" /> {formatCurrency(thisMonthPay.paidAmount || 0)} paid
                            </span>
                            <div className="text-xs text-orange-600 mt-0.5">
                              ₹{(group.monthlyAmount - (thisMonthPay.paidAmount || 0)).toLocaleString()} due
                            </div>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            color === 'black'
                              ? 'bg-gray-700 text-gray-200'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {color === 'black'
                              ? <><AlertCircle className="h-3.5 w-3.5" /> Overdue</>
                              : <><Clock className="h-3.5 w-3.5" /> Not Paid</>
                            }
                          </span>
                        )}
                      </td>

                      {/* Withdrawal */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {withdrawal ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <Banknote className="h-3.5 w-3.5" />
                              {MONTH_SHORT[withdrawal.month - 1]} {withdrawal.year} · {formatCurrency(withdrawal.amount)}
                            </span>
                            <div className={`text-xs mt-1 ${subTextColor}`}>
                              {withdrawal.status === 'APPROVED' ? '✓ Approved' : withdrawal.status === 'PENDING' ? '⏳ Pending' : '✗ Rejected'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className={`text-sm font-semibold ${color === 'black' ? 'text-gray-400' : 'text-gray-800'}`}>
                              {formatCurrency(poolAmount)}
                            </span>
                            <div className={`text-xs mt-0.5 ${subTextColor}`}>Not withdrawn</div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {thisMonthPay?.status === 'PARTIAL' ? (
                            <>
                              <button
                                onClick={() => { setPartialModal(member); setPartialAmount('') }}
                                className="px-2.5 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                Add Amount
                              </button>
                              <a
                                href={`https://wa.me/91${member.phoneNumber}?text=${encodeURIComponent(`Hi ${member.name}, please pay the remaining Chitti amount for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Send WhatsApp reminder"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            </>
                          ) : thisMonthPay?.status !== 'PAID' ? (
                            <>
                              <button
                                onClick={() => handleMarkPaid(member)}
                                disabled={markingPaid === member.memberId}
                                className="px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {markingPaid === member.memberId ? '...' : 'Mark Paid'}
                              </button>
                              <button
                                onClick={() => { setPartialModal(member); setPartialAmount('') }}
                                className="px-2.5 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                Pay Partial
                              </button>
                              <a
                                href={`https://wa.me/91${member.phoneNumber}?text=${encodeURIComponent(`Hi ${member.name}, please pay your Chitti amount of ₹${group.monthlyAmount * (member.chittiCount || 1)} for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Send WhatsApp reminder"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            </>
                          ) : null}
                          {!withdrawal && (
                            <button
                              onClick={() => openWithdrawModal(member)}
                              className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Withdraw
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.memberId)}
                            className={`p-1.5 rounded transition-colors ${color === 'black' ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredMembers.length > 0 && (
          <div className={`px-6 py-3 text-sm text-center rounded-b-lg font-medium ${
            paidThisMonth === members.length
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-50 text-gray-600'
          }`}>
            {paidThisMonth === members.length && members.length > 0
              ? `✓ All ${members.length} members paid for ${MONTH_SHORT[selectedMonth - 1]} ${selectedYear}`
              : `${pendingThisMonth} member${pendingThisMonth !== 1 ? 's' : ''} yet to pay for ${MONTH_SHORT[selectedMonth - 1]} ${selectedYear}`}
          </div>
        )}
          </>
        )}
      </div>

      {/* ── Withdraw Modal ── */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Record Withdrawal</h2>
                  <p className="text-sm text-gray-500">{withdrawModal.name}</p>
                </div>
              </div>
              <button onClick={() => setWithdrawModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                Recording withdrawal for <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                  className="input-field"
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">Pool value: {formatCurrency(poolAmount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-gray-400">(min 10 chars)</span></label>
                <textarea
                  value={withdrawForm.reason}
                  onChange={e => setWithdrawForm(f => ({ ...f, reason: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="e.g. Member's turn to receive chitti for this month"
                />
                <p className="text-xs text-gray-400 mt-1">{withdrawForm.reason.length} characters</p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button onClick={() => setWithdrawModal(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawForm.amount || withdrawForm.reason.trim().length < 10}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {withdrawing ? 'Saving...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Partial Payment Modal ── */}
      {partialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getThisMonthPayment(partialModal.memberId)?.status === 'PARTIAL' ? 'Add to Partial Payment' : 'Partial Payment'}
                  </h2>
                  <p className="text-sm text-gray-500">{partialModal.name}</p>
                </div>
              </div>
              <button onClick={() => setPartialModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                {getThisMonthPayment(partialModal.memberId)?.status === 'PARTIAL' ? (
                  <>
                    Already paid: <strong>{formatCurrency(getThisMonthPayment(partialModal.memberId)?.paidAmount || 0)}</strong>
                    &nbsp;· Remaining: <strong>{formatCurrency(group.monthlyAmount * (partialModal.chittiCount || 1) - (getThisMonthPayment(partialModal.memberId)?.paidAmount || 0))}</strong>
                  </>
                ) : (
                  <>Monthly amount: <strong>{formatCurrency(group.monthlyAmount * (partialModal.chittiCount || 1))}</strong> for <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong></>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Record (₹)</label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={e => setPartialAmount(e.target.value)}
                  className="input-field"
                  min={1}
                  max={group.monthlyAmount * (partialModal.chittiCount || 1)}
                  placeholder={`Enter amount (max ₹${group.monthlyAmount * (partialModal.chittiCount || 1)})`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button onClick={() => setPartialModal(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button
                  onClick={handlePartialPayment}
                  disabled={!partialAmount || Number(partialAmount) <= 0}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Modal ── */}
      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Member?</h3>
            <p className="text-sm text-gray-600 mb-6">This will remove the member from this group. Their payment history will not be deleted.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmRemoveId(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={doRemoveMember} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark All Paid Confirm Modal ── */}
      {markAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mark All Paid?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will mark <strong>{members.filter(m => { const p = getThisMonthPayment(m.memberId); return !p || (p.status !== 'PAID' && p.status !== 'PARTIAL') }).length} member(s)</strong> as paid for <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>.
            </p>
            <p className="text-xs text-gray-400 mb-6">Partial payments will not be affected.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMarkAllConfirm(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={handleMarkAllPaid}
                disabled={markingAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {markingAll ? 'Marking...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickAddMemberToGroup
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSuccess={fetchAll}
        groupId={groupId!}
        groupName={group.name}
      />
    </div>
  )
}
