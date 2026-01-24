'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

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
      <div>
        <Header title="System Settings" />
        <div className="p-6">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="System Settings" />

      <div className="p-6">
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  This sets the default language for new users.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
                {success && (
                  <span className="text-green-600 flex items-center gap-1 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Saved successfully
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Approval Workflow</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-500 text-sm">
                Approval workflow configuration will be available in Phase 3.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Database Connection</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-500 text-sm">
                External database connection for product sync will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
