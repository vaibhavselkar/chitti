import { useState, useEffect } from 'react'
import { X, Users, User, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface AddMemberToGroupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
  groupName: string
  currentMembersCount: number
  totalMembers: number
}

interface Member {
  _id: string
  name: string
  phoneNumber: string
}

export default function AddMemberToGroup({ 
  isOpen, 
  onClose, 
  onSuccess, 
  groupId, 
  groupName, 
  currentMembersCount, 
  totalMembers 
}: AddMemberToGroupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers()
    }
  }, [isOpen])

  const fetchAvailableMembers = async () => {
    try {
      const response = await axiosInstance.get('/members')
      setAvailableMembers(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load members')
    }
  }

  const handleAddMember = async () => {
    if (!selectedMember) {
      toast.error('Please select a member to add')
      return
    }

    if (currentMembersCount >= totalMembers) {
      toast.error('Group is already full')
      return
    }

    setIsLoading(true)
    try {
      await axiosInstance.post(`/groups/${groupId}/members`, { memberId: selectedMember })
      toast.success('Member added to group successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member to group')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2$3')
  }

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNumber.includes(searchTerm)
  )

  const isGroupFull = currentMembersCount >= totalMembers

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Member to Group</h2>
              <p className="text-sm text-gray-600">Add a member to "{groupName}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Group Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Group Status:</div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isGroupFull 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isGroupFull ? 'FULL' : 'OPEN'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Members: {currentMembersCount}/{totalMembers}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Members
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Search members by name or phone..."
              />
            </div>
          </div>

          {/* Members List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Members
            </label>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                <p className="text-gray-600">No available members match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredMembers.map((member) => (
                  <label
                    key={member._id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedMember === member._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="member"
                      value={member._id}
                      checked={selectedMember === member._id}
                      onChange={() => setSelectedMember(member._id)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{formatPhoneNumber(member.phoneNumber)}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Selected member will be added to "{groupName}"</li>
              <li>• Member must already exist in your member list</li>
              <li>• Group capacity: {currentMembersCount}/{totalMembers}</li>
              {isGroupFull && (
                <li className="text-red-600">• This group is full and cannot accept more members</li>
              )}
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
              type="button"
              onClick={handleAddMember}
              disabled={isLoading || !selectedMember || isGroupFull}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}