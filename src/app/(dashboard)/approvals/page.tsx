'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { Check, X, Clock, AlertCircle } from 'lucide-react'

interface WasteEntry {
  id: string
  quantity: number
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  line: { name: string }
  product: { name: string }
  reason: { name: string; name_ar?: string }
  recorded_by_user: { full_name: string }
}

export default function ApprovalsPage() {
  const { profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [entries, setEntries] = useState<WasteEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchEntries()
    }
  }, [profile, filter])

  const fetchEntries = async () => {
    setLoadingEntries(true)
    try {
      let query = supabase
        .from('waste_entries')
        .select(`
          id,
          quantity,
          notes,
          status,
          created_at,
          line:lines(name),
          product:products(name),
          reason:reasons(name, name_ar),
          recorded_by_user:profiles!waste_entries_recorded_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching entries:', error)
      } else {
        setEntries(data as unknown as WasteEntry[])
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

    const { error } = await supabase
      .from('waste_entries')
      .update({
        status: 'approved',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      fetchEntries()
    } else {
      console.error('Error approving:', error)
    }
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    if (!profile) return
    setProcessingId(id)

    const { error } = await supabase
      .from('waste_entries')
      .update({
        status: 'rejected',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      fetchEntries()
    } else {
      console.error('Error rejecting:', error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            {t('waste.status.pending')}
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <Check className="w-3 h-3" />
            {t('waste.status.approved')}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <X className="w-3 h-3" />
            {t('waste.status.rejected')}
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  // Check if user can approve (admin or approver)
  const canApprove = profile?.role === 'admin' || profile?.role === 'approver'

  return (
    <div>
      <Header title={t('approvals.title')} />

      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-600">{t('approvals.description')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {t(`approvals.filter.${status}`)}
            </button>
          ))}
        </div>

        {/* Entries List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingEntries ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>{t('approvals.noEntries')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <div key={entry.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {entry.product?.name}
                        </h3>
                        {getStatusBadge(entry.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">{t('production.line')}:</span>{' '}
                          {entry.line?.name}
                        </p>
                        <p>
                          <span className="font-medium">{t('production.quantity')}:</span>{' '}
                          {entry.quantity}
                        </p>
                        <p>
                          <span className="font-medium">{t('waste.reason')}:</span>{' '}
                          {locale === 'ar' && entry.reason?.name_ar
                            ? entry.reason.name_ar
                            : entry.reason?.name}
                        </p>
                        <p>
                          <span className="font-medium">{t('production.recordedBy')}:</span>{' '}
                          {entry.recorded_by_user?.full_name}
                        </p>
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">{t('production.notes')}:</span>{' '}
                          {entry.notes}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>

                    {canApprove && entry.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(entry.id)}
                          disabled={processingId === entry.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 me-2" />
                          {t('approvals.approve')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(entry.id)}
                          disabled={processingId === entry.id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 me-2" />
                          {t('approvals.reject')}
                        </Button>
                      </div>
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
