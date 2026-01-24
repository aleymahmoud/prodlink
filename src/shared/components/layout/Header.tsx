'use client'

import { Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}
