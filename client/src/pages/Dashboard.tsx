import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Calendar, Users, TrendingUp, AlertTriangle, Plus, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface Group {
  _id: string
  name: string
  totalMembers: number
  monthlyAmount: number
  totalMonths: number
  status: 'OPEN' | 'FULL'
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const groupsRes = await axiosInstance.get('/groups')
      setGroups(groupsRes.data.data || [])
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const totalCollection = groups.reduce((sum, g) => sum + g.totalMembers * g.monthlyAmount * g.totalMonths, 0)

  const statsCards = [
    { title: 'Total Groups', value: groups.length, icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Active Groups', value: groups.filter(g => g.status === 'OPEN').length, icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Total Collection', value: `₹${totalCollection.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Full Groups', value: groups.filter(g => g.status === 'FULL').length, icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your Chitti groups today.</p>
          </div>
          <button onClick={() => navigate('/groups')} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '...' : stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No groups yet. Create your first group!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 5).map((group) => (
                <div
                  key={group._id}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-sm text-gray-600">{group.totalMembers} members · ₹{group.monthlyAmount.toLocaleString()}/mo</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    group.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {group.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/groups')} className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all groups →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => navigate('/groups')} className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-left">
              <Plus className="h-6 w-6 text-primary-600" />
              <div>
                <p className="font-medium text-primary-900">Create New Group</p>
                <p className="text-sm text-primary-700">Set up a new Chitti group</p>
              </div>
            </button>
            <button onClick={() => navigate('/members')} className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Add New Member</p>
                <p className="text-sm text-green-700">Register a new member</p>
              </div>
            </button>
            <button onClick={() => navigate('/groups')} className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <DollarSign className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Record Payment</p>
                <p className="text-sm text-orange-700">Track a member payment</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
