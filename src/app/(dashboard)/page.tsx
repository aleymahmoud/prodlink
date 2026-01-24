'use client'

import { useUser } from '@/features/auth/hooks/useUser'
import { Header } from '@/shared/components/layout/Header'
import { Factory, Trash2, AlertTriangle, RefreshCw, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { profile, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Welcome back, {profile?.full_name}
          </h2>
          <p className="text-sm text-gray-500">
            Here&apos;s what&apos;s happening today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Production"
            value="--"
            icon={Factory}
            color="blue"
          />
          <StatCard
            title="Pending Approvals"
            value="--"
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Today's Waste"
            value="--"
            icon={Trash2}
            color="red"
          />
          <StatCard
            title="Reprocessing"
            value="--"
            icon={RefreshCw}
            color="green"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm text-center py-8">
              No recent activity. Start by adding production data.
            </p>
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
