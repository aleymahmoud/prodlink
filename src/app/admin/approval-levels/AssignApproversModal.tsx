'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Portal } from '@/shared/components/ui/Portal'
import { X, UserPlus, Trash2, Search } from 'lucide-react'

interface Approver {
  id: string
  user_id: string
  user_name: string
  user_email: string
}

interface ApprovalLevel {
  id: string
  name: string
  name_ar: string | null
  level_order: number
  approvers: Approver[]
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface AssignApproversModalProps {
  level: ApprovalLevel
  onClose: () => void
  onSave: () => void
}

export function AssignApproversModal({ level, onClose, onSave }: AssignApproversModalProps) {
  const [approvers, setApprovers] = useState<Approver[]>(level.approvers)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        // Filter to only show active users who can approve (admin, approver roles)
        const eligibleUsers = data.filter(
          (user: User) => ['admin', 'approver'].includes(user.role)
        )
        setAvailableUsers(eligibleUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setIsLoading(false)
  }

  const handleAddApprover = async (user: User) => {
    setError(null)

    // Check if already assigned
    if (approvers.some(a => a.user_id === user.id)) {
      setError('This user is already assigned to this level')
      return
    }

    try {
      const res = await fetch('/api/approval-levels/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_level_id: level.id,
          user_id: user.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add approver')
      }

      const newAssignment = await res.json()
      setApprovers([...approvers, newAssignment])
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleRemoveApprover = async (approver: Approver) => {
    setError(null)

    try {
      const res = await fetch(`/api/approval-levels/assignments?id=${approver.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove approver')
      }

      setApprovers(approvers.filter(a => a.id !== approver.id))
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const filteredUsers = availableUsers.filter(user => {
    const isAlreadyAssigned = approvers.some(a => a.user_id === user.id)
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return !isAlreadyAssigned && matchesSearch
  })

  return (
    <Portal>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />

          <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-6 pb-4 pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Approvers
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Level {level.level_order}: {level.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Current Approvers */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Current Approvers ({approvers.length})
                </h4>
                {approvers.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                    No approvers assigned yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvers.map((approver) => (
                      <div
                        key={approver.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {approver.user_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {approver.user_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {approver.user_email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveApprover(approver)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove approver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Approvers */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Add Approvers
                </h4>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {isLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                    {searchTerm ? 'No matching users found' : 'No available users to add'}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs">
                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddApprover(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Add approver"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
