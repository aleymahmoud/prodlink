'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useTranslation } from '@/shared/i18n'
import { CheckCircle, Globe, Workflow, Sparkles } from 'lucide-react'

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const langSetting = data.find((s: { key: string }) => s.key === 'default_language')
        if (langSetting) {
          setDefaultLanguage(langSetting.value || 'en')
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'default_language',
          value: defaultLanguage,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* General Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl shadow-sm">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('admin.settings.general')}</h3>
              <p className="text-sm text-slate-500">Language and localization preferences</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              {t('admin.settings.defaultLanguage')}
            </label>
            <div className="relative">
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:bg-slate-100"
              >
                <option value="en">🇺🇸 {t('languages.en')}</option>
                <option value="ar">🇸🇦 {t('languages.ar')}</option>
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t('admin.settings.languageDescription')}
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('admin.settings.saving')}
                </span>
              ) : (
                t('admin.settings.saveSettings')
              )}
            </Button>
            {success && (
              <span className="flex items-center gap-2 text-emerald-600 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="p-1 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                </div>
                {t('admin.settings.successMessage')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approval Workflow Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl shadow-sm">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t('admin.settings.approvalWorkflow')}</h3>
              <p className="text-sm text-slate-500">Configure approval rules and routing</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Coming Soon</p>
              <p className="text-sm text-amber-700 mt-1">
                {t('admin.settings.approvalWorkflowNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
