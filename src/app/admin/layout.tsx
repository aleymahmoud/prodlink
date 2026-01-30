'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout'
import { useTranslation } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'
import {
  Settings,
  Users,
  Factory,
  Package,
  List,
  Activity,
} from 'lucide-react'

interface TabItem {
  key: string
  href: string
  icon: React.ElementType
}

const tabs: TabItem[] = [
  { key: 'general', href: '/admin/settings', icon: Settings },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'lines', href: '/admin/lines', icon: Factory },
  { key: 'products', href: '/admin/products', icon: Package },
  { key: 'reasons', href: '/admin/reasons', icon: List },
  { key: 'observability', href: '/admin/observability', icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="min-h-full">
        {/* Settings Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('nav.settings')}
          </h1>
        </div>

        <div className="flex">
          {/* Left Tab Navigation */}
          <div className="w-56 bg-white border-e border-gray-200 min-h-[calc(100vh-8rem)]">
            <nav className="py-4">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href ||
                  (tab.href !== '/admin/settings' && pathname.startsWith(tab.href))

                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative',
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {/* Active indicator arrow */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e" />
                    )}
                    <tab.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{t(`admin.tabs.${tab.key}`)}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-gray-50">
            {children}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
