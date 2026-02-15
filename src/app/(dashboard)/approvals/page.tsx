'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { Check, X, Clock, AlertCircle, ClipboardCheck, Filter, CheckCircle, XCircle, ArrowRight, FileCheck, FileX } from 'lucide-react'

interface WasteEntry {
  id: string
  quantity: number
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  current_approval_level: number | null
  total_levels: number
  app_approved: boolean
  form_approved: boolean
  can_approve: boolean
  created_at: string
  line: { name: string } | null
  product: { name: string } | null
  reason: { name: string; name_ar?: string } | null
  recorded_by_user: { full_name: string } | null
}

export default function ApprovalsPage() {
  const { profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [entries, setEntries] = useState<WasteEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  useEffect(() => {
    if (profile) {
      fetchEntries()
    }
  }, [profile, filter])

  const fetchEntries = async () => {
    setLoadingEntries(true)
    try {
      const res = await fetch(`/api/approvals?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      } else {
        console.error('Error fetching entries')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingEntries(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!profile) return
    setProcessingId(id)

    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      })

      if (res.ok) {
        fetchEntries()
      } else {
        console.error('Error approving')
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    if (!profile) return
    setProcessingId(id)

    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      })

      if (res.ok) {
        fetchEntries()
      } else {
        console.error('Error rejecting')
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setProcessingId(null)
  }

  const handleFormApproval = async (id: string, formApproved: boolean) => {
    if (!profile) return
    setProcessingId(id)

    try {
      const res = await fetch('/api/waste/form-approval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, form_approved: formApproved }),
      })

      if (res.ok) {
        fetchEntries()
      } else {
        const data = await res.json()
        console.error('Error:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setProcessingId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusBadge = (entry: WasteEntry) => {
    const { status, current_approval_level, total_levels } = entry
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Clock className="w-3.5 h-3.5" />
              {t('waste.status.pending')}
            </span>
            {total_levels > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                Level {current_approval_level}/{total_levels}
              </span>
            )}
          </div>
        )
      case 'approved':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5" />
              App {t('waste.status.approved')}
            </span>
            {entry.form_approved ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                <FileCheck className="w-3.5 h-3.5" />
                Form Signed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                <FileX className="w-3.5 h-3.5" />
                Form Pending
              </span>
            )}
          </div>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-100">
            <XCircle className="w-3.5 h-3.5" />
            {t('waste.status.rejected')}
          </span>
        )
      default:
        return null
    }
  }

  const getFilterStyles = (filterValue: string) => {
    const baseStyles = "px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
    if (filter === filterValue) {
      switch (filterValue) {
        case 'pending':
          return `${baseStyles} bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20`
        case 'approved':
          return `${baseStyles} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20`
        case 'rejected':
          return `${baseStyles} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20`
        default:
          return `${baseStyles} bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20`
      }
    }
    return `${baseStyles} bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  // Check if user can approve (admin or approver)
  const canApprove = profile?.role === 'admin' || profile?.role === 'approver'

  return (
    <div>
      <Header
        title={t('approvals.title')}
        subtitle={t('approvals.description')}
        icon={
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl shadow-sm">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Filter by Status</h3>
              <p className="text-sm text-slate-500">View entries by approval status</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={getFilterStyles(status)}
              >
                {t(`approvals.filter.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl shadow-sm">
                <ClipboardCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Waste Entries</h3>
                <p className="text-sm text-slate-500">{entries.length} entries found</p>
              </div>
            </div>
          </div>

          {loadingEntries ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-500 font-medium">{t('common.loading')}</span>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-slate-600 font-medium">{t('approvals.noEntries')}</p>
              <p className="text-sm text-slate-500 mt-2">No entries match your current filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-6 hover:bg-slate-50/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {entry.product?.name}
                        </h3>
                        {getStatusBadge(entry)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{t('production.line')}:</span>
                          <span className="font-medium text-slate-900">{entry.line?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{t('production.quantity')}:</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 rounded-md">
                            <span className="font-bold text-red-600">{entry.quantity}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{t('waste.reason')}:</span>
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-red-100 text-red-700">
                            {locale === 'ar' && entry.reason?.name_ar
                              ? entry.reason.name_ar
                              : entry.reason?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">{t('production.recordedBy')}:</span>
                          <span className="font-medium text-slate-900">{entry.recorded_by_user?.full_name}</span>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">{t('production.notes')}:</span>{' '}
                            {entry.notes}
                          </p>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-slate-400 font-medium">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>

                    {entry.can_approve && entry.status === 'pending' && (
                      <div className="flex gap-2 lg:flex-col xl:flex-row">
                        <Button
                          onClick={() => handleApprove(entry.id)}
                          disabled={processingId === entry.id}
                          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20"
                        >
                          {entry.current_approval_level && entry.total_levels > 0 && entry.current_approval_level < entry.total_levels ? (
                            <>
                              <ArrowRight className="w-4 h-4 me-2" />
                              Approve to L{(entry.current_approval_level || 0) + 1}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 me-2" />
                              {t('approvals.approve')}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(entry.id)}
                          disabled={processingId === entry.id}
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <X className="w-4 h-4 me-2" />
                          {t('approvals.reject')}
                        </Button>
                      </div>
                    )}

                    {entry.status === 'approved' && entry.app_approved && !entry.form_approved && (
                      <Button
                        onClick={() => handleFormApproval(entry.id, true)}
                        disabled={processingId === entry.id}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20"
                      >
                        <FileCheck className="w-4 h-4 me-2" />
                        Mark Form Signed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
