'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import {
  LayoutDashboard,
  Factory,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Users,
  Settings,
  Package,
  List,
  LogOut,
  Globe,
  ClipboardCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { signOut } from '@/features/auth/services/auth'

interface NavItem {
  key: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const navigation: NavItem[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'production', href: '/production', icon: Factory },
  { key: 'waste', href: '/waste', icon: Trash2 },
  { key: 'damage', href: '/damage', icon: AlertTriangle },
  { key: 'reprocessing', href: '/reprocessing', icon: RefreshCw },
  { key: 'approvals', href: '/approvals', icon: ClipboardCheck, roles: ['admin', 'approver'] },
]

const adminNavigation: NavItem[] = [
  { key: 'users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { key: 'lines', href: '/admin/lines', icon: Factory, roles: ['admin'] },
  { key: 'products', href: '/admin/products', icon: Package, roles: ['admin'] },
  { key: 'reasons', href: '/admin/reasons', icon: List, roles: ['admin'] },
  { key: 'observability', href: '/admin/observability', icon: Activity, roles: ['admin'] },
  { key: 'settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { profile, isLoading } = useUser()
  const { t, locale, setLocale } = useTranslation()

  const isAdmin = profile?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en')
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed && (
          <Link href="/" className="text-xl font-bold">
            ProdLink
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="text-xl font-bold mx-auto">
            P
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
            title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
            {locale === 'en' ? 'AR' : 'EN'}
          </button>
        )}
      </div>

      {/* Collapse toggle button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-8 mx-2 mt-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      )}

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => !item.roles || (profile && item.roles.includes(profile.role)))
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? t(`nav.${item.key}`) : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
              </Link>
            )
          })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t('nav.admin')}
                </p>
              )}
              {collapsed && (
                <div className="border-t border-gray-700 mx-2" />
              )}
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {!isLoading && profile && !collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            <p className="text-xs text-gray-500 capitalize">{t(`admin.users.roles.${profile.role}`)}</p>
          </div>
        )}
        {collapsed && (
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center w-full p-2 mb-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
            title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? t('auth.signOut') : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>{t('auth.signOut')}</span>}
        </button>
      </div>
    </div>
  )
}
