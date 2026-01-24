'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { X } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
