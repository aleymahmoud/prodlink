'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Rocket,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'

interface Deployment {
  uid: string
  name: string
  url: string
  created: number
  state: string
  readyState: string
  meta?: { githubCommitMessage?: string }
}

export default function ObservabilityPage() {
  const { profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loadingDeployments, setLoadingDeployments] = useState(false)
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDeployments()
    }
  }, [profile])

  const fetchDeployments = async () => {
    setLoadingDeployments(true)
    setDeploymentsError(null)
    try {
      const response = await fetch('/api/vercel/deployments')
      const data = await response.json()

      if (!response.ok) {
        setDeploymentsError(data.error || 'Failed to fetch deployments')
        setDeployments([])
      } else {
        setDeployments(data.deployments || [])
      }
    } catch (error) {
      setDeploymentsError('Failed to connect to server')
    } finally {
      setLoadingDeployments(false)
    }
  }

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getDeploymentStatusIcon = (state: string) => {
    switch (state) {
      case 'READY':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'BUILDING':
      case 'INITIALIZING':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
      case 'QUEUED':
        return <Clock className="w-5 h-5 text-gray-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{t('common.noAccess') || 'Access denied'}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-gray-600">
          {t('admin.observability.description') || 'Monitor deployments and system performance'}
        </p>
      </div>

      {/* Deployments */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              {t('admin.observability.recentDeployments') || 'Recent Deployments'}
            </h3>
          </div>
          <Button
            variant="outline"
            onClick={fetchDeployments}
            disabled={loadingDeployments}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDeployments ? 'animate-spin' : ''}`} />
            {t('common.refresh') || 'Refresh'}
          </Button>
        </div>

        {loadingDeployments ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : deploymentsError ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600 mb-2">{deploymentsError}</p>
            <p className="text-sm text-gray-500">
              {t('admin.observability.vercelTokenHint') || 'Make sure VERCEL_TOKEN is set in your environment variables.'}
            </p>
          </div>
        ) : deployments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('admin.observability.noDeployments') || 'No deployments found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {deployments.map((deployment) => (
              <div key={deployment.uid} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {getDeploymentStatusIcon(deployment.readyState)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {deployment.meta?.githubCommitMessage || deployment.name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                        deployment.readyState === 'READY'
                          ? 'bg-green-100 text-green-800'
                          : deployment.readyState === 'ERROR'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deployment.readyState}
                      </span>
                    </div>
                    {deployment.url && (
                      <a
                        href={`https://${deployment.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {deployment.url}
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(deployment.created)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
