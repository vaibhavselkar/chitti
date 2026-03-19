import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Search, Filter, Phone, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import CreateMember from '../components/CreateMember'
import axiosInstance from '../lib/axiosInstance'

interface Member {
  _id: string
  name: string
  phoneNumber: string
  createdAt: string
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/members')
      setMembers(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return
    try {
      await axiosInstance.delete(`/members/${memberId}`)
      toast.success('Member deleted successfully')
      fetchMembers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete member')
    }
  }

  const filtered = members
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phoneNumber.includes(searchTerm))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-1">Manage your Chitti group members</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Members ({filtered.length})</h2>
            <div className="text-sm text-gray-600">{members.length} total</div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading members...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search criteria' : 'Add your first member to get started'}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">Add your first member</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Member Name', 'Phone Number', 'Member Since', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {member.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleDelete(member._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateMember isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={fetchMembers} />
    </div>
  )
}
