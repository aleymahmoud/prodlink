'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useTranslation } from '@/shared/i18n'
import { Plus, Edit, Trash2, Users, ArrowUpDown, CheckCircle2, XCircle } from 'lucide-react'
import { ApprovalLevelModal } from './ApprovalLevelModal'
import { AssignApproversModal } from './AssignApproversModal'

type ApprovalType = 'sequential' | 'parallel'

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
  approval_type: ApprovalType
  is_active: boolean
  approvers: Approver[]
}

export default function ApprovalLevelsPage() {
  const [levels, setLevels] = useState<ApprovalLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<ApprovalLevel | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<ApprovalLevel | null>(null)

  const { t } = useTranslation()

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/approval-levels')
      if (res.ok) {
        const data = await res.json()
        setLevels(data)
      }
    } catch (error) {
      console.error('Error fetching approval levels:', error)
    }
    setIsLoading(false)
  }

  const handleEdit = (level: ApprovalLevel) => {
    setEditingLevel(level)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingLevel(null)
    setIsModalOpen(true)
  }

  const handleAssignApprovers = (level: ApprovalLevel) => {
    setSelectedLevel(level)
    setIsAssignModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingLevel(null)
  }

  const handleAssignModalClose = () => {
    setIsAssignModalOpen(false)
    setSelectedLevel(null)
  }

  const handleSave = async () => {
    await fetchLevels()
    handleModalClose()
  }

  const handleAssignSave = async () => {
    await fetchLevels()
  }

  const toggleLevelStatus = async (level: ApprovalLevel) => {
    try {
      const res = await fetch('/api/approval-levels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: level.id,
          is_active: !level.is_active,
        }),
      })
      if (res.ok) {
        fetchLevels()
      }
    } catch (error) {
      console.error('Error toggling level status:', error)
    }
  }

  const handleDelete = async (level: ApprovalLevel) => {
    if (!confirm(`Are you sure you want to delete "${level.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/approval-levels?id=${level.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchLevels()
      }
    } catch (error) {
      console.error('Error deleting level:', error)
    }
  }

  const getApprovalTypeBadge = (type: ApprovalType) => {
    if (type === 'sequential') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          <ArrowUpDown className="w-3 h-3" />
          Sequential
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
        <Users className="w-3 h-3" />
        Parallel
      </span>
    )
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <p className="text-gray-600">
              Configure multi-level approval workflow for waste entries
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 me-2" />
            Add Level
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : levels.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpDown className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Approval Levels</h3>
              <p className="text-slate-500 mb-4">
                Create approval levels to enable multi-level workflow for waste entries.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 me-2" />
                Create First Level
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level Name
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approvers
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {level.level_order}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {level.name}
                        </div>
                        {level.name_ar && (
                          <div className="text-sm text-gray-500" dir="rtl">
                            {level.name_ar}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApprovalTypeBadge(level.approval_type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {level.approvers.length > 0 ? (
                          <div className="flex -space-x-2">
                            {level.approvers.slice(0, 3).map((approver, idx) => (
                              <div
                                key={approver.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
                                title={approver.user_name}
                              >
                                {approver.user_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            ))}
                            {level.approvers.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold ring-2 ring-white">
                                +{level.approvers.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No approvers</span>
                        )}
                        <button
                          onClick={() => handleAssignApprovers(level)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Manage approvers"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleLevelStatus(level)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                          level.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {level.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(level)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(level)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-2">How Approval Workflow Works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Sequential:</strong> Approvers must approve in order. Level 1 must approve before Level 2 can see the entry.</li>
            <li><strong>Parallel:</strong> All approvers at the level can approve simultaneously. Entry moves to next level when all approve.</li>
          </ul>
        </div>
      </div>

      {isModalOpen && (
        <ApprovalLevelModal
          level={editingLevel}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {isAssignModalOpen && selectedLevel && (
        <AssignApproversModal
          level={selectedLevel}
          onClose={handleAssignModalClose}
          onSave={handleAssignSave}
        />
      )}
    </>
  )
}
