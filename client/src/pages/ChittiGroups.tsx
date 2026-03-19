import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, Plus, UserPlus, Trash2, Eye, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import CreateGroup from '../components/CreateGroup'
import QuickAddMemberToGroup from '../components/QuickAddMemberToGroup'
import axiosInstance from '../lib/axiosInstance'

interface ChittiGroup {
  _id: string
  name: string
  totalMembers: number
  monthlyAmount: number
  totalMonths: number
  collectionDay: number
  startDate: string
  status: 'OPEN' | 'FULL'
}

export default function ChittiGroups() {
  const [groups, setGroups] = useState<ChittiGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [quickAddGroup, setQuickAddGroup] = useState<ChittiGroup | null>(null)
  const navigate = useNavigate()

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/groups')
      setGroups(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return
    try {
      await axiosInstance.delete(`/groups/${groupId}`)
      toast.success('Group deleted successfully')
      fetchGroups()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete group')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chitti Groups</h1>
            <p className="text-gray-600 mt-1">Manage your Chitti groups and track their progress</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Create Group</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Groups', value: groups.length, icon: Calendar, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Total Members', value: groups.reduce((t, g) => t + g.totalMembers, 0), icon: Users, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Total Value', value: formatCurrency(groups.reduce((t, g) => t + g.totalMembers * g.monthlyAmount * g.totalMonths, 0)), icon: TrendingUp, bg: 'bg-purple-50', color: 'text-purple-600' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className={`h-8 w-8 ${s.color}`} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Groups</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">Create your first Chitti group to get started</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">Create your first group</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Group Name', 'Members', 'Monthly Amount', 'Duration', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      <div className="text-sm text-gray-500">Start: {new Date(group.startDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.totalMembers}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(group.monthlyAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.totalMonths} months</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${group.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => navigate(`/groups/${group._id}`)} className="text-blue-600 hover:text-blue-900" title="View Details"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => setQuickAddGroup(group)} disabled={group.status === 'FULL'} className="text-green-600 hover:text-green-900 disabled:opacity-40 disabled:cursor-not-allowed" title="Add Member"><UserPlus className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(group._id)} className="text-red-600 hover:text-red-900" title="Delete Group"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateGroup isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={fetchGroups} />
      {quickAddGroup && (
        <QuickAddMemberToGroup
          isOpen={!!quickAddGroup}
          onClose={() => setQuickAddGroup(null)}
          onSuccess={fetchGroups}
          groupId={quickAddGroup._id}
          groupName={quickAddGroup.name}
        />
      )}
    </div>
  )
}
