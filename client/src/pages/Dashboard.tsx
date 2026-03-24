import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Calendar, Users, TrendingUp, AlertTriangle, Plus, DollarSign, Clock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface Group {
  _id: string
  name: string
  totalMembers: number
  enrolledMembers: number
  monthlyAmount: number
  totalMonths: number
  collectionDay: number
  startDate: string
  status: 'OPEN' | 'FULL'
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const today = new Date()
  const todayDay = today.getDate()
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const groupsRes = await axiosInstance.get('/groups')
      setGroups(groupsRes.data.data || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const totalValue = groups.reduce((sum, g) => sum + g.totalMembers * g.monthlyAmount * g.totalMonths, 0)
  const openGroups = groups.filter(g => g.status === 'OPEN')
  const openSlots = groups.reduce((sum, g) => sum + Math.max(0, g.totalMembers - g.enrolledMembers), 0)

  // Collection due within next 5 days (by collectionDay of month)
  const dueSoon = groups.filter(g => {
    const diff = g.collectionDay - todayDay
    return diff >= 0 && diff <= 5
  })
  const collectionOverdue = groups.filter(g => {
    const diff = todayDay - g.collectionDay
    return diff > 0 && diff <= 3
  })

  const statsCards = [
    { title: 'Total Groups', value: groups.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Open Groups', value: openGroups.length, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Value', value: isLoading ? '...' : fmt(totalValue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Open Slots', value: openSlots, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
            <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
          </div>
          <button onClick={() => navigate('/groups')} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{isLoading ? '...' : stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Due Soon */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" /> Collection Due Soon
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
            </div>
          ) : dueSoon.length === 0 && collectionOverdue.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No collections due in the next 5 days</p>
          ) : (
            <div className="space-y-2">
              {collectionOverdue.map(g => (
                <div
                  key={g._id}
                  onClick={() => navigate(`/groups/${g._id}`)}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100"
                >
                  <div>
                    <p className="text-sm font-medium text-red-800">{g.name}</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Collection day {g.collectionDay} passed · {fmt(g.monthlyAmount * g.totalMembers)}/mo
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400 flex-shrink-0" />
                </div>
              ))}
              {dueSoon.map(g => (
                <div
                  key={g._id}
                  onClick={() => navigate(`/groups/${g._id}`)}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100"
                >
                  <div>
                    <p className="text-sm font-medium text-orange-800">{g.name}</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      {g.collectionDay === todayDay ? 'Today' : `Day ${g.collectionDay}`} · {fmt(g.monthlyAmount * g.totalMembers)}/mo
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-orange-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open for Enrollment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" /> Open for Enrollment
          </h2>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
            </div>
          ) : openGroups.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">All groups are full</p>
          ) : (
            <div className="space-y-2">
              {openGroups.map(g => {
                const pct = Math.round((g.enrolledMembers / g.totalMembers) * 100)
                return (
                  <div
                    key={g._id}
                    onClick={() => navigate(`/groups/${g._id}`)}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-green-800">{g.name}</p>
                      <p className="text-xs text-green-600">{g.enrolledMembers}/{g.totalMembers} filled</p>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Groups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">All Groups</h2>
          <button onClick={() => navigate('/groups')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Manage →
          </button>
        </div>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No groups yet</p>
            <button onClick={() => navigate('/groups')} className="btn-primary">Create your first group</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map(g => {
              const pct = Math.round((g.enrolledMembers / g.totalMembers) * 100)
              return (
                <div
                  key={g._id}
                  onClick={() => navigate(`/groups/${g._id}`)}
                  className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${g.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {g.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{fmt(g.monthlyAmount)}/mo · {g.enrolledMembers}/{g.totalMembers} members</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-blue-500' : 'bg-primary-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => navigate('/groups')} className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-left">
            <Plus className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary-900">New Group</p>
              <p className="text-xs text-primary-700">Create a Chitti group</p>
            </div>
          </button>
          <button onClick={() => navigate('/members')} className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">Add Member</p>
              <p className="text-xs text-green-700">Register a member</p>
            </div>
          </button>
          <button onClick={() => navigate('/groups')} className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
            <DollarSign className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">Record Payment</p>
              <p className="text-xs text-orange-700">Track collection</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
