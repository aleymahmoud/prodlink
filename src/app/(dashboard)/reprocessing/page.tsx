'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Plus, X, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Line { id: string; name: string; code: string; type: string; is_active: boolean }
interface Product { id: string; name: string; code: string; unit_of_measure: string; is_active: boolean }
interface Reason { id: string; name: string; name_ar: string | null; type: string; is_active: boolean }
interface ReprocessingEntry {
  id: string; line_id: string; product_id: string; quantity: number; unit_of_measure: string;
  reason_id: string; notes: string | null; created_at: string;
  lines?: { id: string; name: string; code: string };
  products?: { id: string; name: string; code: string };
  reasons?: { id: string; name: string; name_ar: string | null };
  profiles?: { id: string; full_name: string };
}

export default function ReprocessingPage() {
  const [entries, setEntries] = useState<ReprocessingEntry[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [reasons, setReasons] = useState<Reason[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    line_id: '', product_id: '', quantity: '', reason_id: '', batch_number: '', notes: '',
  })

  const { user, profile } = useUser()
  const { t } = useTranslation()

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [entriesRes, linesRes, productsRes, reasonsRes] = await Promise.all([
        fetch('/api/reprocessing'), fetch('/api/lines'), fetch('/api/products'), fetch('/api/reasons?type=reprocessing'),
      ])
      if (entriesRes.ok) setEntries(await entriesRes.json())
      if (linesRes.ok) setLines((await linesRes.json()).filter((l: Line) => l.is_active))
      if (productsRes.ok) setProducts((await productsRes.json()).filter((p: Product) => p.is_active))
      if (reasonsRes.ok) setReasons((await reasonsRes.json()).filter((r: Reason) => r.is_active))
    } catch (err) { console.error('Error:', err) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setIsSubmitting(true); setError(null); setSuccess(null)
    const selectedProduct = products.find(p => p.id === formData.product_id)
    try {
      const res = await fetch('/api/reprocessing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: formData.line_id, product_id: formData.product_id,
          quantity: parseFloat(formData.quantity), unit_of_measure: selectedProduct?.unit_of_measure || 'unit',
          reason_id: formData.reason_id, batch_number: formData.batch_number || null, notes: formData.notes || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSuccess(t('reprocessing.successMessage'))
      setFormData({ ...formData, product_id: '', quantity: '', reason_id: '', batch_number: '', notes: '' })
      fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setIsSubmitting(false) }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  return (
    <div>
      <Header title={t('reprocessing.title')} subtitle={t('reprocessing.description')}
        icon={<div className="p-2.5 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg shadow-violet-500/20"><RefreshCw className="w-5 h-5 text-white" /></div>}
        actions={<Button onClick={() => setShowForm(!showForm)} className={`rounded-xl ${showForm ? '' : 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/20'}`} variant={showForm ? 'outline' : 'primary'}>
          {showForm ? <><X className="w-4 h-4 me-2" />{t('common.cancel')}</> : <><Plus className="w-4 h-4 me-2" />{t('reprocessing.newEntry')}</>}
        </Button>}
      />

      <div className="p-6 space-y-6">
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl shadow-sm"><Plus className="w-4 h-4 text-white" /></div>
                <div><h3 className="font-semibold text-slate-900">{t('reprocessing.newEntry')}</h3><p className="text-sm text-slate-500">Record items for reprocessing</p></div>
              </div>
            </div>
            <div className="p-6">
              {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3"><div className="p-1 bg-red-100 rounded-lg"><XCircle className="w-4 h-4" /></div>{error}</div>}
              {success && <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-3"><div className="p-1 bg-emerald-100 rounded-lg"><CheckCircle className="w-4 h-4" /></div>{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">{t('production.line')} *</label>
                    <select value={formData.line_id} onChange={(e) => setFormData({ ...formData, line_id: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                      <option value="">{t('production.selectLine')}</option>
                      {lines.map((line) => <option key={line.id} value={line.id}>{line.name} ({line.code})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">{t('production.product')} *</label>
                    <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                      <option value="">{t('production.selectProduct')}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">{t('production.quantity')} *</label>
                    <div className="flex">
                      <input type="number" step="0.001" min="0.001" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-s-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" placeholder={t('production.enterQuantity')} />
                      <span className="inline-flex items-center px-4 py-3 border border-s-0 border-slate-200 bg-slate-100 text-slate-600 rounded-e-xl text-sm font-medium">{products.find(p => p.id === formData.product_id)?.unit_of_measure || 'units'}</span>
                    </div>
                  </div>
                  <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">{t('reprocessing.reason')} *</label>
                    <select value={formData.reason_id} onChange={(e) => setFormData({ ...formData, reason_id: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                      <option value="">{t('reprocessing.selectReason')}</option>
                      {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">{t('production.notes')}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none" placeholder="Optional notes..." />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/20">
                    {isSubmitting ? 'Submitting...' : t('reprocessing.submit')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl shadow-sm"><Clock className="w-4 h-4 text-white" /></div>
              <div><h3 className="font-semibold text-slate-900">{t('reprocessing.recentEntries')}</h3><p className="text-sm text-slate-500">Track reprocessing records</p></div>
            </div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /><span className="text-slate-500 font-medium">{t('common.loading')}</span></div></div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center"><div className="mx-auto w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4"><RefreshCw className="w-8 h-8 text-violet-400" /></div><p className="text-slate-600 font-medium">{t('reprocessing.noEntries')}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('production.dateTime')}</th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('production.line')}</th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('production.product')}</th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('production.quantity')}</th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('reprocessing.reason')}</th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('production.recordedBy')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(entry.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900">{entry.lines?.name}</div><div className="text-xs text-slate-500">{entry.lines?.code}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900">{entry.products?.name}</div><div className="text-xs text-slate-500">{entry.products?.code}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg"><span className="text-sm font-bold text-violet-600">{entry.quantity}</span><span className="text-xs text-violet-500">{entry.unit_of_measure}</span></span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-100 text-violet-700">{entry.reasons?.name}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{entry.profiles?.full_name}</td>
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
