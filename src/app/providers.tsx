'use client'

import { ReactNode } from 'react'
import { I18nProvider } from '@/shared/i18n'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  )
}
