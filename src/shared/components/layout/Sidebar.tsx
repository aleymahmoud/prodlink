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
  Settings,
  LogOut,
  Globe,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { signOut } from '@/features/auth/services/auth'

interface NavItem {
  key: string
  href: string
  icon: React.ElementType
  roles?: string[]
  color?: string
}

const navigation: NavItem[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
  { key: 'production', href: '/production', icon: Factory, color: 'from-emerald-500 to-emerald-600' },
  { key: 'waste', href: '/waste', icon: Trash2, color: 'from-red-500 to-red-600' },
  { key: 'damage', href: '/damage', icon: AlertTriangle, color: 'from-amber-500 to-amber-600' },
  { key: 'reprocessing', href: '/reprocessing', icon: RefreshCw, color: 'from-violet-500 to-violet-600' },
  { key: 'approvals', href: '/approvals', icon: ClipboardCheck, roles: ['admin', 'approver'], color: 'from-cyan-500 to-cyan-600' },
]

// Settings link for admin users (all admin pages accessible from Settings)
const adminNavigation: NavItem[] = [
  { key: 'settings', href: '/admin/settings', icon: Settings, roles: ['admin'], color: 'from-slate-500 to-slate-600' },
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
      "flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white transition-all duration-300",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Logo Section */}
      <div className="flex items-center justify-between h-20 px-5 border-b border-slate-800/50">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ProdLink
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
            title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5" />
            {locale === 'en' ? 'AR' : 'EN'}
          </button>
        )}
      </div>

      {/* Collapse toggle button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-9 mx-3 mt-3 text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/60 rounded-lg transition-all"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation
          .filter((item) => !item.roles || (profile && item.roles.includes(profile.role)))
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                  collapsed && 'justify-center px-3'
                )}
                title={collapsed ? t(`nav.${item.key}`) : undefined}
              >
                <div className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-white/20'
                    : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                )}>
                  <item.icon className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )} />
                </div>
                {!collapsed && <span className="flex-1">{t(`nav.${item.key}`)}</span>}
              </Link>
            )
          })}

        {isAdmin && (
          <>
            <div className={cn("my-4 mx-3 border-t border-slate-800/50", collapsed && "mx-2")} />
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith('/admin/')
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                    collapsed && 'justify-center px-3'
                  )}
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                >
                  <div className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                  )}>
                    <item.icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )} />
                  </div>
                  {!collapsed && <span className="flex-1">{t(`nav.${item.key}`)}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800/50">
        {!isLoading && profile && !collapsed && (
          <div className="mb-4 p-3 bg-slate-800/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-blue-500/20 text-blue-300">
                {t(`admin.users.roles.${profile.role}`)}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center w-full p-2.5 mb-2 text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/60 rounded-xl transition-all"
            title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/30 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all',
            collapsed && 'justify-center px-3'
          )}
          title={collapsed ? t('auth.signOut') : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t('auth.signOut')}</span>}
        </button>
      </div>
    </div>
  )
}
