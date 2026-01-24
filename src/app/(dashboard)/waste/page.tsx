'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useUser } from '@/features/auth/hooks/useUser'
import { Line, Product, Reason, WasteEntryWithRelations } from '@/shared/types/database'
import { Plus, X, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function WastePage() {
  const [entries, setEntries] = useState<WasteEntryWithRelations[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [reasons, setReasons] = useState<Reason[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    line_id: '',
    product_id: '',
    quantity: '',
    reason_id: '',
    batch_number: '',
    notes: '',
  })

  const { profile } = useUser()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)

    const [entriesRes, linesRes, productsRes, reasonsRes] = await Promise.all([
      supabase
        .from('waste_entries')
        .select('*, lines(*), products(*), reasons(*), profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('lines')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('reasons')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'waste')
        .order('name'),
    ])

    if (entriesRes.data) setEntries(entriesRes.data)
    if (linesRes.data) setLines(linesRes.data)
    if (productsRes.data) setProducts(productsRes.data)
    if (reasonsRes.data) setReasons(reasonsRes.data)

    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const selectedProduct = products.find(p => p.id === formData.product_id)

    const { error: insertError } = await supabase
      .from('waste_entries')
      .insert({
        line_id: formData.line_id,
        product_id: formData.product_id,
        quantity: parseFloat(formData.quantity),
        unit_of_measure: selectedProduct?.unit_of_measure || 'unit',
        reason_id: formData.reason_id,
        batch_number: formData.batch_number || null,
        notes: formData.notes || null,
        created_by: profile.id,
        approval_status: 'pending',
        app_approved: false,
        form_approved: false,
      })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    setSuccess('Waste entry submitted for approval!')
    setFormData({
      line_id: formData.line_id,
      product_id: '',
      quantity: '',
      reason_id: '',
      batch_number: '',
      notes: '',
    })
    setIsSubmitting(false)
    fetchData()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
    }
  }

  return (
    <div>
      <Header title="Waste Entry" />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">
              Record waste items requiring approval
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Waste entries require multi-level approval before being finalized
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">New Waste Entry</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Line *
                  </label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a line</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quantity"
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md text-sm">
                      {products.find(p => p.id === formData.product_id)?.unit_of_measure || 'units'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waste Reason *
                  </label>
                  <select
                    value={formData.reason_id}
                    onChange={(e) => setFormData({ ...formData, reason_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a reason</option>
                    {reasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                  </select>
                  {reasons.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No waste reasons configured. Please add reasons in Admin &gt; Reasons.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional batch number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe why this waste occurred"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Waste Entries</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No waste entries yet.</p>
              <p className="text-sm">Click "New Entry" to record waste.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Line
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.lines?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.lines?.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.products?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.products?.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.quantity} {entry.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {entry.reasons?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(entry.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.profiles?.full_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
