'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import { useUser } from '@/features/auth/hooks/useUser'
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
} from 'lucide-react'
import { signOut } from '@/features/auth/services/auth'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Waste', href: '/waste', icon: Trash2 },
  { name: 'Damage', href: '/damage', icon: AlertTriangle },
  { name: 'Reprocessing', href: '/reprocessing', icon: RefreshCw },
]

const adminNavigation: NavItem[] = [
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Lines', href: '/admin/lines', icon: Factory, roles: ['admin'] },
  { name: 'Products', href: '/admin/products', icon: Package, roles: ['admin'] },
  { name: 'Reasons', href: '/admin/reasons', icon: List, roles: ['admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile, isLoading } = useUser()

  const isAdmin = profile?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <Link href="/" className="text-xl font-bold">
          ProdLink
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        {!isLoading && profile && (
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
