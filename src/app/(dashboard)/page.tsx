'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Header } from '@/shared/components/layout/Header'
import { createClient } from '@/shared/lib/supabase/client'
import { Factory, Trash2, RefreshCw, Clock, AlertTriangle } from 'lucide-react'

interface DashboardStats {
  todayProduction: number
  pendingApprovals: number
  todayWaste: number
  todayReprocessing: number
}

interface RecentActivity {
  id: string
  type: 'production' | 'waste' | 'damage' | 'reprocessing'
  product_name: string
  quantity: number
  created_at: string
  user_name: string
}

export default function DashboardPage() {
  const { profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [stats, setStats] = useState<DashboardStats>({
    todayProduction: 0,
    pendingApprovals: 0,
    todayWaste: 0,
    todayReprocessing: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    setLoadingStats(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    try {
      // Fetch today's production count
      const { count: productionCount } = await supabase
        .from('production_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)

      // Fetch pending waste approvals
      const { count: pendingCount } = await supabase
        .from('waste_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Fetch today's waste count
      const { count: wasteCount } = await supabase
        .from('waste_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)

      // Fetch today's reprocessing count
      const { count: reprocessingCount } = await supabase
        .from('reprocessing_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO)

      setStats({
        todayProduction: productionCount || 0,
        pendingApprovals: pendingCount || 0,
        todayWaste: wasteCount || 0,
        todayReprocessing: reprocessingCount || 0,
      })

      // Fetch recent activity (last 10 entries across all types)
      const activities: RecentActivity[] = []

      // Production entries
      const { data: prodData } = await supabase
        .from('production_entries')
        .select('id, quantity, created_at, products(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (prodData) {
        prodData.forEach((entry: any) => {
          activities.push({
            id: entry.id,
            type: 'production',
            product_name: entry.products?.name || 'Unknown',
            quantity: entry.quantity,
            created_at: entry.created_at,
            user_name: entry.profiles?.full_name || 'Unknown',
          })
        })
      }

      // Waste entries
      const { data: wasteData } = await supabase
        .from('waste_entries')
        .select('id, quantity, created_at, products(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (wasteData) {
        wasteData.forEach((entry: any) => {
          activities.push({
            id: entry.id,
            type: 'waste',
            product_name: entry.products?.name || 'Unknown',
            quantity: entry.quantity,
            created_at: entry.created_at,
            user_name: entry.profiles?.full_name || 'Unknown',
          })
        })
      }

      // Damage entries
      const { data: damageData } = await supabase
        .from('damage_entries')
        .select('id, quantity, created_at, products(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (damageData) {
        damageData.forEach((entry: any) => {
          activities.push({
            id: entry.id,
            type: 'damage',
            product_name: entry.products?.name || 'Unknown',
            quantity: entry.quantity,
            created_at: entry.created_at,
            user_name: entry.profiles?.full_name || 'Unknown',
          })
        })
      }

      // Sort by date and take latest 10
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivity(activities.slice(0, 10))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'production': return Factory
      case 'waste': return Trash2
      case 'damage': return AlertTriangle
      case 'reprocessing': return RefreshCw
      default: return Factory
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'production': return 'text-blue-600 bg-blue-50'
      case 'waste': return 'text-red-600 bg-red-50'
      case 'damage': return 'text-yellow-600 bg-yellow-50'
      case 'reprocessing': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getActivityLabel = (type: string) => {
    return t(`nav.${type}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div>
      <Header title={t('dashboard.title')} />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            {t('dashboard.welcomeBack')}, {profile?.full_name}
          </h2>
          <p className="text-sm text-gray-500">
            {t('dashboard.todayOverview')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.todayProduction')}
            value={loadingStats ? '...' : stats.todayProduction.toString()}
            icon={Factory}
            color="blue"
          />
          <StatCard
            title={t('dashboard.pendingApprovals')}
            value={loadingStats ? '...' : stats.pendingApprovals.toString()}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title={t('dashboard.todayWaste')}
            value={loadingStats ? '...' : stats.todayWaste.toString()}
            icon={Trash2}
            color="red"
          />
          <StatCard
            title={t('dashboard.reprocessing')}
            value={loadingStats ? '...' : stats.todayReprocessing.toString()}
            icon={RefreshCw}
            color="green"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{t('dashboard.recentActivity')}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {loadingStats ? (
              <div className="p-6 text-center text-gray-500">
                {t('common.loading')}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6">
                <p className="text-gray-500 text-sm text-center py-8">
                  {t('dashboard.noRecentActivity')}
                </p>
              </div>
            ) : (
              recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={`${activity.type}-${activity.id}`} className="px-6 py-4 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.product_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getActivityLabel(activity.type)} • {activity.quantity} • {activity.user_name}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: 'blue' | 'yellow' | 'red' | 'green'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
