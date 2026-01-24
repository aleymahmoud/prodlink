'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Line, Product, ProductionEntryWithRelations } from '@/shared/types/database'
import { Plus, X, Factory } from 'lucide-react'

export default function ProductionPage() {
  const [entries, setEntries] = useState<ProductionEntryWithRelations[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    line_id: '',
    product_id: '',
    quantity: '',
    batch_number: '',
    notes: '',
  })

  const { profile } = useUser()
  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)

    const [entriesRes, linesRes, productsRes] = await Promise.all([
      supabase
        .from('production_entries')
        .select('*, lines(*), products(*), profiles(*)')
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
    ])

    if (entriesRes.data) setEntries(entriesRes.data)
    if (linesRes.data) setLines(linesRes.data)
    if (productsRes.data) setProducts(productsRes.data)

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
      .from('production_entries')
      .insert({
        line_id: formData.line_id,
        product_id: formData.product_id,
        quantity: parseFloat(formData.quantity),
        unit_of_measure: selectedProduct?.unit_of_measure || 'unit',
        batch_number: formData.batch_number || null,
        notes: formData.notes || null,
        created_by: profile.id,
      })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
      return
    }

    setSuccess(t('production.successMessage'))
    setFormData({
      line_id: formData.line_id,
      product_id: '',
      quantity: '',
      batch_number: '',
      notes: '',
    })
    setIsSubmitting(false)
    fetchData()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      <Header title={t('production.title')} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <p className="text-gray-600">
            {t('production.description')}
          </p>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="w-4 h-4 me-2" />
                {t('common.cancel')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 me-2" />
                {t('production.newEntry')}
              </>
            )}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">{t('production.newEntry')}</h3>

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
                    {t('production.line')} *
                  </label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('production.selectLine')}</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('production.product')} *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('production.selectProduct')}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('production.quantity')} *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-s-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('production.enterQuantity')}
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-s-0 border-gray-300 bg-gray-50 text-gray-500 rounded-e-md text-sm">
                      {products.find(p => p.id === formData.product_id)?.unit_of_measure || 'units'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('production.batchNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('production.optionalBatch')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('production.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('production.optionalNotes')}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('production.saving') : t('production.saveEntry')}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">{t('production.recentEntries')}</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('production.noEntries')}</p>
              <p className="text-sm">{t('production.clickToRecord')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.dateTime')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.line')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.product')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.quantity')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.batchNumber')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('production.recordedBy')}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.batch_number || '-'}
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
