'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { Line, LineType } from '@/shared/types/database'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { LineModal } from './LineModal'

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<Line | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchLines()
  }, [])

  const fetchLines = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('lines')
      .select('*')
      .order('name')

    if (!error && data) {
      setLines(data)
    }
    setIsLoading(false)
  }

  const handleEdit = (line: Line) => {
    setEditingLine(line)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingLine(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingLine(null)
  }

  const handleSave = async () => {
    await fetchLines()
    handleModalClose()
  }

  const toggleLineStatus = async (line: Line) => {
    const { error } = await supabase
      .from('lines')
      .update({ is_active: !line.is_active })
      .eq('id', line.id)

    if (!error) {
      fetchLines()
    }
  }

  const getTypeBadgeColor = (type: LineType) => {
    return type === 'finished'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800'
  }

  return (
    <div>
      <Header title="Production Lines" />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Manage production lines in your factory
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Line
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : lines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No production lines found. Add your first line to get started.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                {lines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {line.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{line.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getTypeBadgeColor(
                          line.type
                        )}`}
                      >
                        {line.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          line.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {line.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit line"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleLineStatus(line)}
                          className={`p-1 ${
                            line.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={line.is_active ? 'Deactivate line' : 'Activate line'}
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
        <LineModal
          line={editingLine}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
