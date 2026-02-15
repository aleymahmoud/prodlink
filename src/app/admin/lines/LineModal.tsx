'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Portal } from '@/shared/components/ui/Portal'
import { X } from 'lucide-react'

type LineType = 'finished' | 'semi-finished'

interface Line {
  id: string
  name: string
  name_en: string | null
  code: string
  type: LineType
}

interface LineModalProps {
  line: Line | null
  onClose: () => void
  onSave: () => void
}

function generateCode(lineName: string): string {
  if (!lineName.trim()) return ''
  const words = lineName.trim().split(/\s+/)
  // Take first letter of each word, uppercase
  const prefix = words.map(w => w[0]).join('').toUpperCase()
  // Add number suffix based on digits found in name, or default
  const numbers = lineName.match(/\d+/)
  const suffix = numbers ? numbers[0].padStart(2, '0') : '01'
  return `${prefix}-${suffix}`
}

export function LineModal({ line, onClose, onSave }: LineModalProps) {
  const [name, setName] = useState(line?.name || '')
  const [nameEn, setNameEn] = useState(line?.name_en || '')
  const [code, setCode] = useState(line?.code || '')
  const [type, setType] = useState<LineType>(line?.type || 'finished')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!line

  const handleNameEnChange = (value: string) => {
    setNameEn(value)
    if (!isEditing) {
      setCode(generateCode(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = '/api/lines'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? { id: line.id, name, name_en: nameEn, code, type }
        : { name, name_en: nameEn, code, type }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save line')
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

          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Line' : 'Add New Line'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Line Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., خط الكرواسون 1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    English Name
                    {!isEditing && <span className="text-xs text-gray-400 ms-2">(used for code generation)</span>}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => handleNameEnChange(e.target.value)}
                    required
                    placeholder="e.g., Croissant Line 1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Line Code
                    {!isEditing && <span className="text-xs text-gray-400 ms-2">(auto-generated)</span>}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g., CL-01"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    readOnly={!isEditing}
                  />
                  {!isEditing && (
                    <p className="mt-1 text-xs text-gray-500">Code is generated from the English name</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Line Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LineType)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="finished">Finished Goods</option>
                    <option value="semi-finished">Semi-Finished</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Line' : 'Create Line'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  )
}
