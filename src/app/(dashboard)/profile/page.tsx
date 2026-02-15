'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { User, Mail, Shield, Calendar, Save, Check } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, isLoading } = useUser()
  const { t } = useTranslation()
  const [fullName, setFullName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/profile/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title="My Profile"
        subtitle="View and manage your account settings"
        icon={
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="p-6 max-w-2xl">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{profile?.fullName}</h2>
                <p className="text-indigo-100 text-sm">{profile?.email}</p>
                <span className="inline-flex items-center mt-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/20 text-white">
                  {t(`admin.users.roles.${profile?.role}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Profile updated successfully
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed</p>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Role
              </label>
              <input
                type="text"
                value={t(`admin.users.roles.${profile?.role}`) || ''}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-slate-400">Contact an administrator to change your role</p>
            </div>

            {/* Member Since */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Member Since
              </label>
              <input
                type="text"
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || fullName === profile?.fullName}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
