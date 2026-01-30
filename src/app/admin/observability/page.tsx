'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { createClient } from '@/shared/lib/supabase/client'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
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

interface ErrorLog {
  id: string
  type: 'error' | 'warning' | 'info' | 'performance'
  message: string
  stack: string | null
  url: string | null
  created_at: string
  metadata: Record<string, unknown>
}

export default function ObservabilityPage() {
  const { profile, isLoading } = useUser()
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState<'deployments' | 'errors'>('deployments')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [loadingDeployments, setLoadingDeployments] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (profile?.role === 'admin') {
      if (activeTab === 'deployments') {
        fetchDeployments()
      } else {
        fetchErrorLogs()
      }
    }
  }, [profile, activeTab])

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

  const fetchErrorLogs = async () => {
    setLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching logs:', error)
      } else {
        setErrorLogs(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingLogs(false)
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

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'performance':
        return <Activity className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getLogTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
      performance: 'bg-purple-100 text-purple-800',
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    )
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
          {t('admin.observability.description') || 'Monitor deployments, errors, and system performance'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('deployments')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'deployments'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <Rocket className="w-4 h-4" />
          {t('admin.observability.deployments') || 'Deployments'}
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'errors'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {t('admin.observability.errorLogs') || 'Error Logs'}
        </button>
      </div>

      {/* Deployments Tab */}
      {activeTab === 'deployments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t('admin.observability.recentDeployments') || 'Recent Deployments'}
            </h3>
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
      )}

      {/* Error Logs Tab */}
      {activeTab === 'errors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {t('admin.observability.applicationLogs') || 'Application Logs'}
            </h3>
            <Button
              variant="outline"
              onClick={fetchErrorLogs}
              disabled={loadingLogs}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              {t('common.refresh') || 'Refresh'}
            </Button>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : errorLogs.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600">
                {t('admin.observability.noErrors') || 'No errors logged. Your application is running smoothly!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {errorLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    {getLogTypeIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getLogTypeBadge(log.type)}
                        <span className="text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{log.message}</p>
                      {log.url && (
                        <p className="text-xs text-gray-500 truncate">
                          URL: {log.url}
                        </p>
                      )}
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            {t('admin.observability.showStackTrace') || 'Show stack trace'}
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            {t('admin.observability.showMetadata') || 'Show metadata'}
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
