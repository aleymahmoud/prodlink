'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useTranslation } from '@/shared/i18n'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { LineModal } from './LineModal'

type LineType = 'finished' | 'semi-finished'

interface Line {
  id: string
  name: string
  name_en: string | null
  code: string
  type: LineType
  is_active: boolean
}

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<Line | null>(null)

  const { t } = useTranslation()

  useEffect(() => {
    fetchLines()
  }, [])

  const fetchLines = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/lines')
      if (res.ok) {
        const data = await res.json()
        setLines(data)
      }
    } catch (error) {
      console.error('Error fetching lines:', error)
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
    try {
      const res = await fetch('/api/lines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: line.id,
          is_active: !line.is_active,
        }),
      })
      if (res.ok) {
        fetchLines()
      }
    } catch (error) {
      console.error('Error toggling line status:', error)
    }
  }

  const getTypeBadgeColor = (type: LineType) => {
    return type === 'finished'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800'
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <p className="text-gray-600">
            {t('admin.lines.description')}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 me-2" />
            {t('admin.lines.addLine')}
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : lines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('admin.lines.noLines')}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.lines.name')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    English Name
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.lines.code')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.lines.type')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
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
                      <div className="text-sm text-gray-500">{line.name_en || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{line.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                          line.type
                        )}`}
                      >
                        {t(`admin.lines.types.${line.type}`)}
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
                        {line.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title={t('common.edit')}
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
                          title={line.is_active ? t('common.inactive') : t('common.active')}
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
    </>
  )
}
