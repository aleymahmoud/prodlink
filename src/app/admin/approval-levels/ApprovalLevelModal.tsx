'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Portal } from '@/shared/components/ui/Portal'
import { X, ArrowUpDown, Users } from 'lucide-react'

type ApprovalType = 'sequential' | 'parallel'

interface ApprovalLevel {
  id: string
  name: string
  name_ar: string | null
  level_order: number
  approval_type: ApprovalType
  is_active: boolean
}

interface ApprovalLevelModalProps {
  level: ApprovalLevel | null
  onClose: () => void
  onSave: () => void
}

export function ApprovalLevelModal({ level, onClose, onSave }: ApprovalLevelModalProps) {
  const [name, setName] = useState(level?.name || '')
  const [nameAr, setNameAr] = useState(level?.name_ar || '')
  const [approvalType, setApprovalType] = useState<ApprovalType>(level?.approval_type || 'sequential')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!level

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = '/api/approval-levels'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? {
            id: level.id,
            name,
            name_ar: nameAr || null,
            approval_type: approvalType,
          }
        : {
            name,
            name_ar: nameAr || null,
            approval_type: approvalType,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save approval level')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />

          <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <form onSubmit={handleSubmit}>
              <div className="bg-white px-6 pb-4 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                      <ArrowUpDown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isEditing ? 'Edit Approval Level' : 'Create Approval Level'}
                    </h3>
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

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Level Name (English)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g., Supervisor Approval"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Level Name (Arabic)
                    </label>
                    <input
                      type="text"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="e.g., موافقة المشرف"
                      dir="rtl"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Approval Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setApprovalType('sequential')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          approvalType === 'sequential'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <ArrowUpDown className={`w-6 h-6 mx-auto mb-2 ${
                          approvalType === 'sequential' ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          approvalType === 'sequential' ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          Sequential
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          One after another
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setApprovalType('parallel')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          approvalType === 'parallel'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Users className={`w-6 h-6 mx-auto mb-2 ${
                          approvalType === 'parallel' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          approvalType === 'parallel' ? 'text-purple-900' : 'text-gray-700'
                        }`}>
                          Parallel
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          All at once
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : isEditing ? 'Update Level' : 'Create Level'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  )
}
