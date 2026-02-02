'use client'

import { Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  onMenuClick?: () => void
  actions?: React.ReactNode
}

export function Header({ title, subtitle, icon, onMenuClick, actions }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-5 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {icon && (
            <div className="hidden sm:block">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
