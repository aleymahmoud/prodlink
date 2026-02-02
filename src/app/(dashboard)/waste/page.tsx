'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Line, Product, Reason, WasteEntryWithRelations } from '@/shared/types/database'
import { Plus, X, Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

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
  const { t } = useTranslation()
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

    setSuccess(t('waste.successMessage'))
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('waste.status.approved')}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-100">
            <XCircle className="w-3.5 h-3.5" />
            {t('waste.status.rejected')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
            {t('waste.status.pending')}
          </span>
        )
    }
  }

  return (
    <div>
      <Header
        title={t('waste.title')}
        subtitle={t('waste.description')}
        icon={
          <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/20">
            <Trash2 className="w-5 h-5 text-white" />
          </div>
        }
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`rounded-xl ${showForm ? '' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20'}`}
            variant={showForm ? 'outline' : 'primary'}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 me-2" />
                {t('common.cancel')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 me-2" />
                {t('waste.newEntry')}
              </>
            )}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Approval Note */}
        <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Approval Required</p>
            <p className="text-sm text-amber-700 mt-0.5">{t('waste.approvalNote')}</p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-400 to-red-500 rounded-xl shadow-sm">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{t('waste.newEntry')}</h3>
                  <p className="text-sm text-slate-500">Record a new waste entry</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
                  <div className="p-1 bg-red-100 rounded-lg">
                    <XCircle className="w-4 h-4" />
                  </div>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-3">
                  <div className="p-1 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('production.line')} *
                    </label>
                    <select
                      value={formData.line_id}
                      onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    >
                      <option value="">{t('production.selectLine')}</option>
                      {lines.map((line) => (
                        <option key={line.id} value={line.id}>
                          {line.name} ({line.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('production.product')} *
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    >
                      <option value="">{t('production.selectProduct')}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
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
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-s-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        placeholder={t('production.enterQuantity')}
                      />
                      <span className="inline-flex items-center px-4 py-3 border border-s-0 border-slate-200 bg-slate-100 text-slate-600 rounded-e-xl text-sm font-medium">
                        {products.find(p => p.id === formData.product_id)?.unit_of_measure || 'units'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('waste.reason')} *
                    </label>
                    <select
                      value={formData.reason_id}
                      onChange={(e) => setFormData({ ...formData, reason_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    >
                      <option value="">{t('waste.selectReason')}</option>
                      {reasons.map((reason) => (
                        <option key={reason.id} value={reason.id}>
                          {reason.name}
                        </option>
                      ))}
                    </select>
                    {reasons.length === 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('waste.noReasonsConfigured')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('production.batchNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      placeholder={t('production.optionalBatch')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t('production.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                    placeholder={t('waste.notesPlaceholder')}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20"
                  >
                    {isSubmitting ? t('waste.submitting') : t('waste.submitForApproval')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-400 to-red-500 rounded-xl shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{t('waste.recentEntries')}</h3>
                <p className="text-sm text-slate-500">Track your waste submissions</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-500 font-medium">{t('common.loading')}</span>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-slate-600 font-medium">{t('waste.noEntries')}</p>
              <p className="text-sm text-slate-500 mt-2">{t('waste.clickToRecord')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('production.dateTime')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('production.line')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('production.product')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('production.quantity')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('waste.reason')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('common.status')}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {t('production.recordedBy')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          {entry.lines?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.lines?.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          {entry.products?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {entry.products?.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
                          <span className="text-sm font-bold text-red-600">{entry.quantity}</span>
                          <span className="text-xs text-red-500">{entry.unit_of_measure}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700">
                          {entry.reasons?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(entry.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
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
