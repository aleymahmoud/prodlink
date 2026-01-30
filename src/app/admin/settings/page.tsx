'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useTranslation } from '@/shared/i18n'
import { CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

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
      <div className="p-6">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  return (
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
      </div>
    </div>
  )
}
