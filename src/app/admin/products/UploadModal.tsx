'use client'

import { useState, useRef } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Portal } from '@/shared/components/ui/Portal'
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface UploadModalProps {
  onClose: () => void
  onSave: () => void
}

interface ParsedProduct {
  name: string
  code: string
  category: string | null
  unit_of_measure: string
  line_id: string | null
  line_display: string
}

export function UploadModal({ onClose, onSave }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setSuccess(null)
    setParsedData([])
    setIsParsing(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/products/parse-excel', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to parse file')
      }

      const data = await res.json()
      setParsedData(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to import products')
      }

      const result = await res.json()
      setSuccess(`Successfully imported ${result.imported} products`)
      setTimeout(() => {
        onSave()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import products')
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

          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Import Products from Excel
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <FileText className="w-5 h-5" />
                    <span>{file.name}</span>
                    {isParsing && <span className="text-sm text-gray-500">Parsing...</span>}
                    <button
                      onClick={() => {
                        setFile(null)
                        setParsedData([])
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload the filled Excel template
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select Excel File
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-700 mb-2">How to import:</p>
                <ol className="text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Download the template using the &quot;Template&quot; button</li>
                  <li>Fill in the product data (use dropdown lists for Line and Unit)</li>
                  <li>Upload the filled file here</li>
                </ol>
              </div>

              {parsedData.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview ({parsedData.length} products):
                  </p>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Line</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Code</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedData.slice(0, 10).map((p, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{p.line_display || '-'}</td>
                            <td className="px-3 py-2">{p.name}</td>
                            <td className="px-3 py-2">{p.code}</td>
                            <td className="px-3 py-2">{p.category || '-'}</td>
                            <td className="px-3 py-2">{p.unit_of_measure}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <p className="text-center text-gray-500 py-2 text-xs">
                        ... and {parsedData.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
            <Button
              onClick={handleImport}
              disabled={isLoading || parsedData.length === 0}
            >
              {isLoading ? 'Importing...' : `Import ${parsedData.length} Products`}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
