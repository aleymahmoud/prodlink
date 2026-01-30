'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useTranslation } from '@/shared/i18n'
import { CheckCircle, Database, Cloud } from 'lucide-react'

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [dbProvider, setDbProvider] = useState<string>('supabase')
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking')

  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setDbStatus('checking')
    try {
      // Check which provider is configured via API
      const response = await fetch('/api/db-status')
      const data = await response.json()
      setDbProvider(data.provider || 'supabase')
      setDbStatus(data.connected ? 'connected' : 'error')
    } catch {
      setDbStatus('error')
    }
  }

  const fetchSettings = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('system_settings')
      .select('*')

    if (data) {
      const langSetting = data.find((s) => s.key === 'default_language')
      if (langSetting) {
        setDefaultLanguage(langSetting.value || 'en')
      }
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess(false)

    const { error } = await supabase
      .from('system_settings')
      .update({ value: defaultLanguage })
      .eq('key', 'default_language')

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div>
        <Header title={t('admin.settings.title')} />
        <div className="p-6">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title={t('admin.settings.title')} />

      <div className="p-6">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t('admin.settings.general')}</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.defaultLanguage')}
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">{t('languages.en')}</option>
                  <option value="ar">{t('languages.ar')}</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {t('admin.settings.languageDescription')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
                </Button>
                {success && (
                  <span className="text-green-600 flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {t('admin.settings.successMessage')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t('admin.settings.approvalWorkflow')}</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-500 text-sm">
                {t('admin.settings.approvalWorkflowNote')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{t('admin.settings.databaseConnection')}</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${dbProvider === 'mysql' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {dbProvider === 'mysql' ? (
                    <Database className={`w-6 h-6 ${dbProvider === 'mysql' ? 'text-blue-600' : 'text-green-600'}`} />
                  ) : (
                    <Cloud className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {dbProvider === 'mysql' ? 'MySQL Database' : 'Supabase (PostgreSQL)'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dbProvider === 'mysql'
                      ? `${process.env.NEXT_PUBLIC_MYSQL_HOST || 'MySQL Server'}`
                      : 'Cloud-hosted PostgreSQL with authentication'
                    }
                  </p>
                </div>
                <div className="ms-auto">
                  {dbStatus === 'checking' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {t('common.loading')}
                    </span>
                  )}
                  {dbStatus === 'connected' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full me-1.5"></span>
                      {t('admin.settings.connected')}
                    </span>
                  )}
                  {dbStatus === 'error' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <span className="w-2 h-2 bg-red-500 rounded-full me-1.5"></span>
                      {t('admin.settings.connectionError')}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {t('admin.settings.databaseProviderNote')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  DATABASE_PROVIDER={dbProvider}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
