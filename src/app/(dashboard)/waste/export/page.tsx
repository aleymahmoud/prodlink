'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { FileText, Download, Calendar, Factory, Filter } from 'lucide-react'

interface Line {
  id: string
  name: string
  code: string
}

export default function WasteExportPage() {
  const { profile, isLoading } = useUser()
  const { t } = useTranslation()
  const [lines, setLines] = useState<Line[]>([])
  const [selectedLine, setSelectedLine] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [status, setStatus] = useState<string>('approved')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchLines()
    // Set default date range to last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const fetchLines = async () => {
    try {
      const res = await fetch('/api/lines')
      if (res.ok) {
        const data = await res.json()
        setLines(data)
      }
    } catch (error) {
      console.error('Error fetching lines:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (selectedLine) params.append('line_id', selectedLine)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (status) params.append('status', status)

      const res = await fetch(`/api/waste/export?${params.toString()}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `waste-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title="Export Waste Report"
        subtitle="Generate PDF reports for ISO compliance documentation"
        icon={
          <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg shadow-rose-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="p-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl shadow-sm">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Report Filters</h3>
                <p className="text-sm text-slate-500">Select criteria for your waste report</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Production Line */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Factory className="w-4 h-4 text-slate-400" />
                Production Line
              </label>
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">All Lines</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Approval Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'approved', label: 'Approved', color: 'emerald' },
                  { value: 'pending', label: 'Pending', color: 'amber' },
                  { value: 'rejected', label: 'Rejected', color: 'red' },
                  { value: 'all', label: 'All', color: 'slate' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      status === option.value
                        ? option.color === 'emerald'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : option.color === 'amber'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : option.color === 'red'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-slate-700 text-white shadow-lg shadow-slate-700/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t border-slate-100">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-2">About Waste Reports</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>Reports include all waste entries matching your filters</li>
            <li>Approval signatures are included for each entry</li>
            <li>Print the report and have it physically signed for ISO compliance</li>
            <li>Mark "Form Approved" in the system after physical signing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
