import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, UserPlus, User, Phone, Search, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axiosInstance'

interface QuickAddMemberToGroupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  groupId: string
  groupName: string
}

interface FormData {
  name: string
  phoneNumber: string
  chittiCount: number
}

interface ExistingMember {
  _id: string
  name: string
  phoneNumber: string
}

export default function QuickAddMemberToGroup({ isOpen, onClose, onSuccess, groupId, groupName }: QuickAddMemberToGroupProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [existingMembers, setExistingMembers] = useState<ExistingMember[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<ExistingMember | null>(null)
  const [chittiCountExisting, setChittiCountExisting] = useState(1)
  const [showTooltip, setShowTooltip] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()

  useEffect(() => {
    if (isOpen && mode === 'existing') {
      fetchMembers()
    }
  }, [isOpen, mode])

  const fetchMembers = async () => {
    try {
      const res = await axiosInstance.get('/members')
      setExistingMembers(res.data.data || [])
    } catch {
      toast.error('Failed to load members')
    }
  }

  const onSubmitNew = async (data: FormData) => {
    setIsLoading(true)
    try {
      let memberId: string
      try {
        const memberRes = await axiosInstance.post('/members', data)
        memberId = memberRes.data.data._id
      } catch (createError: any) {
        if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
          const membersRes = await axiosInstance.get('/members')
          const existing = (membersRes.data.data || []).find((m: any) => m.phoneNumber === data.phoneNumber)
          if (!existing) {
            toast.error('Member already exists but could not be found')
            return
          }
          memberId = existing._id
        } else {
          throw createError
        }
      }
      await axiosInstance.post(`/groups/${groupId}/members`, { memberId, chittiCount: data.chittiCount || 1 })
      toast.success('Member added to group successfully!')
      reset()
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitExisting = async () => {
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }
    setIsLoading(true)
    try {
      await axiosInstance.post(`/groups/${groupId}/members`, { memberId: selectedMember._id, chittiCount: chittiCountExisting })
      toast.success('Member added to group successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setMode('new')
    setSelectedMember(null)
    setMemberSearch('')
    setChittiCountExisting(1)
    onClose()
  }

  const filteredMembers = existingMembers.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phoneNumber.includes(memberSearch)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Member</h2>
              <p className="text-sm text-gray-600">Adding to "{groupName}"</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('new')}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${mode === 'new' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            New Member
          </button>
          <button
            onClick={() => { setMode('existing'); fetchMembers() }}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${mode === 'existing' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Existing Member
          </button>
        </div>

        {mode === 'new' ? (
          <form onSubmit={handleSubmit(onSubmitNew)} className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Member Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    maxLength: { value: 50, message: 'Name cannot exceed 50 characters' }
                  })}
                  type="text"
                  id="name"
                  className="input-field pl-10"
                  placeholder="e.g., Ramesh Kumar"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phoneNumber', {
                    required: 'Mobile number is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' }
                  })}
                  type="tel"
                  id="phoneNumber"
                  className="input-field pl-10"
                  placeholder="e.g., 9876543210"
                  maxLength={10}
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
            </div>

            <div>
              <label htmlFor="chittiCount" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-1.5">
                  Chitti Slots
                  <span className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {showTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 bg-gray-800 text-white text-xs rounded-lg p-2.5 z-10 shadow-lg">
                        Number of chitti slots this member holds. A member with 2 slots pays double the monthly amount and receives double when it's their turn.
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </span>
                  <span className="text-gray-400 font-normal">(Default: 1)</span>
                </span>
              </label>
              <input
                {...register('chittiCount', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Minimum 1 slot' },
                  max: { value: 10, message: 'Maximum 10 slots' }
                })}
                type="number"
                id="chittiCount"
                className="input-field"
                min={1}
                max={10}
                defaultValue={1}
              />
              {errors.chittiCount && <p className="mt-1 text-sm text-red-600">{errors.chittiCount.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Adding...</span>
                  </div>
                ) : 'Add Member'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            {/* Search existing */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            {/* Member list */}
            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No members found</p>
              ) : (
                filteredMembers.map(m => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMember(m)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedMember?._id === m._id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.phoneNumber}</p>
                    </div>
                    {selectedMember?._id === m._id && (
                      <span className="ml-auto text-xs font-medium text-primary-600">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Chitti count for existing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-1.5">
                  Chitti Slots
                  <span className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    {showTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 bg-gray-800 text-white text-xs rounded-lg p-2.5 z-10 shadow-lg">
                        Number of chitti slots this member holds. A member with 2 slots pays double the monthly amount and receives double when it's their turn.
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </span>
                  <span className="text-gray-400 font-normal">(Default: 1)</span>
                </span>
              </label>
              <input
                type="number"
                value={chittiCountExisting}
                onChange={e => setChittiCountExisting(Math.min(10, Math.max(1, Number(e.target.value))))}
                className="input-field"
                min={1}
                max={10}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button
                type="button"
                onClick={onSubmitExisting}
                disabled={isLoading || !selectedMember}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Adding...</span>
                  </div>
                ) : 'Add Member'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
