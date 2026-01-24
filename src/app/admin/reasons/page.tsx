'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { Reason } from '@/shared/types/database'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { ReasonModal } from './ReasonModal'

type ReasonType = 'waste' | 'damage' | 'reprocessing'

export default function ReasonsPage() {
  const [reasons, setReasons] = useState<Reason[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReason, setEditingReason] = useState<Reason | null>(null)
  const [activeTab, setActiveTab] = useState<ReasonType>('waste')

  const supabase = createClient()

  useEffect(() => {
    fetchReasons()
  }, [])

  const fetchReasons = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('reasons')
      .select('*')
      .order('type')
      .order('name')

    if (!error && data) {
      setReasons(data)
    }
    setIsLoading(false)
  }

  const handleEdit = (reason: Reason) => {
    setEditingReason(reason)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingReason(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingReason(null)
  }

  const handleSave = async () => {
    await fetchReasons()
    handleModalClose()
  }

  const toggleReasonStatus = async (reason: Reason) => {
    const { error } = await supabase
      .from('reasons')
      .update({ is_active: !reason.is_active })
      .eq('id', reason.id)

    if (!error) {
      fetchReasons()
    }
  }

  const filteredReasons = reasons.filter((r) => r.type === activeTab)

  const tabs: { key: ReasonType; label: string }[] = [
    { key: 'waste', label: 'Waste Reasons' },
    { key: 'damage', label: 'Damage Reasons' },
    { key: 'reprocessing', label: 'Reprocessing Reasons' },
  ]

  return (
    <div>
      <Header title="Reason Lists" />

      <div className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <p className="text-gray-600">
            Manage reasons for waste, damage, and reprocessing entries
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Reason
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {reasons.filter((r) => r.type === tab.key).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredReasons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {activeTab} reasons found. Add your first reason to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason (English)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason (Arabic)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReasons.map((reason) => (
                  <tr key={reason.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reason.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500" dir="rtl">
                        {(reason as Reason & { name_ar?: string }).name_ar || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reason.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {reason.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(reason)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit reason"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleReasonStatus(reason)}
                          className={`p-1 ${
                            reason.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={reason.is_active ? 'Deactivate' : 'Activate'}
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
      </div>

      {isModalOpen && (
        <ReasonModal
          reason={editingReason}
          defaultType={activeTab}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
