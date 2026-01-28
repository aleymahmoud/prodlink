'use client'

import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useUser } from '@/features/auth/hooks/useUser'
import { useTranslation } from '@/shared/i18n'
import { Line, ProductWithLine, ProductionEntryWithRelations, LineType } from '@/shared/types/database'
import { Factory, Filter, Save, History, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface ProductEntry {
  product_id: string
  quantity: string
  unit_of_measure: string
}

interface ProductTotals {
  userToday: number
  globalToday: number
}

const UNIT_OPTIONS = [
  { value: 'unit', label: 'Unit / Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'box', label: 'Box' },
  { value: 'carton', label: 'Carton' },
  { value: 'tray', label: 'Tray' },
]

type SortField = 'code' | 'name' | 'userToday' | 'globalToday'
type SortDirection = 'asc' | 'desc'

export default function ProductionPage() {
  const [entries, setEntries] = useState<ProductionEntryWithRelations[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [products, setProducts] = useState<ProductWithLine[]>([])
  const [todayEntries, setTodayEntries] = useState<ProductionEntryWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Filters
  const [selectedLineId, setSelectedLineId] = useState<string>('')
  const [selectedLineType, setSelectedLineType] = useState<LineType | ''>('')
  const [productSearch, setProductSearch] = useState<string>('')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Product entries (quantity for each product)
  const [productEntries, setProductEntries] = useState<Record<string, ProductEntry>>({})

  const { profile } = useUser()
  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  // Reset product entries when line changes
  useEffect(() => {
    setProductEntries({})
    setProductSearch('')
  }, [selectedLineId])

  const fetchData = async () => {
    setIsLoading(true)

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [entriesRes, linesRes, productsRes, todayEntriesRes] = await Promise.all([
      supabase
        .from('production_entries')
        .select('*, lines(*), products(*), profiles(*)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('lines')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('products')
        .select('*, lines(*)')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('production_entries')
        .select('*, lines(*), products(*), profiles(*)')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),
    ])

    if (entriesRes.data) setEntries(entriesRes.data)
    if (linesRes.data) setLines(linesRes.data)
    if (productsRes.data) setProducts(productsRes.data)
    if (todayEntriesRes.data) setTodayEntries(todayEntriesRes.data)

    setIsLoading(false)
  }

  // Filter lines by type
  const filteredLines = selectedLineType
    ? lines.filter(line => line.type === selectedLineType)
    : lines

  // Get products for selected line
  const lineProducts = selectedLineId
    ? products.filter(p => p.line_id === selectedLineId)
    : []

  // Calculate totals for each product
  const productTotals = useMemo(() => {
    const totals: Record<string, ProductTotals> = {}

    lineProducts.forEach(product => {
      const userEntries = todayEntries.filter(
        e => e.product_id === product.id && e.created_by === profile?.id
      )
      const globalEntries = todayEntries.filter(
        e => e.product_id === product.id
      )

      totals[product.id] = {
        userToday: userEntries.reduce((sum, e) => sum + e.quantity, 0),
        globalToday: globalEntries.reduce((sum, e) => sum + e.quantity, 0),
      }
    })

    return totals
  }, [lineProducts, todayEntries, profile?.id])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = lineProducts

    // Filter by search
    if (productSearch.trim()) {
      const search = productSearch.toLowerCase()
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(search) ||
             p.code.toLowerCase().includes(search)
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'userToday':
          comparison = (productTotals[a.id]?.userToday || 0) - (productTotals[b.id]?.userToday || 0)
          break
        case 'globalToday':
          comparison = (productTotals[a.id]?.globalToday || 0) - (productTotals[b.id]?.globalToday || 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [lineProducts, productSearch, sortField, sortDirection, productTotals])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const handleQuantityChange = (productId: string, quantity: string, defaultUnit: string) => {
    setProductEntries(prev => ({
      ...prev,
      [productId]: {
        product_id: productId,
        quantity,
        unit_of_measure: prev[productId]?.unit_of_measure || defaultUnit,
      }
    }))
  }

  const handleUnitChange = (productId: string, unit: string, defaultUnit: string) => {
    setProductEntries(prev => ({
      ...prev,
      [productId]: {
        product_id: productId,
        quantity: prev[productId]?.quantity || '',
        unit_of_measure: unit,
      }
    }))
  }

  const handleSubmit = async () => {
    if (!profile || !selectedLineId) return

    // Filter entries that have quantity > 0
    const validEntries = Object.values(productEntries).filter(
      entry => entry.quantity && parseFloat(entry.quantity) > 0
    )

    if (validEntries.length === 0) {
      setError('Please enter quantity for at least one product')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const insertData = validEntries.map(entry => ({
        line_id: selectedLineId,
        product_id: entry.product_id,
        quantity: parseFloat(entry.quantity),
        unit_of_measure: entry.unit_of_measure,
        created_by: profile.id,
      }))

      const { error: insertError } = await supabase
        .from('production_entries')
        .insert(insertData)

      if (insertError) throw insertError

      setSuccess(`Successfully recorded ${validEntries.length} production ${validEntries.length === 1 ? 'entry' : 'entries'}`)
      setProductEntries({})
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const hasEntries = Object.values(productEntries).some(
    entry => entry.quantity && parseFloat(entry.quantity) > 0
  )

  return (
    <div>
      <Header title={t('production.title')} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <p className="text-gray-600">
            {t('production.description')}
          </p>
          <Button
            variant={showHistory ? 'primary' : 'outline'}
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 me-2" />
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filter Production Line</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line Type
              </label>
              <select
                value={selectedLineType}
                onChange={(e) => {
                  setSelectedLineType(e.target.value as LineType | '')
                  setSelectedLineId('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="finished">Finished</option>
                <option value="semi-finished">Semi-Finished</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production Line *
              </label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a production line</option>
                {filteredLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* Products Table */}
        {selectedLineId ? (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-medium">
                  Products for {lines.find(l => l.id === selectedLineId)?.name}
                </h3>
                <div className="flex items-center gap-4">
                  {/* Product Search */}
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by name or code..."
                      className="ps-9 pe-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-64"
                    />
                  </div>
                  {hasEntries && (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      <Save className="w-4 h-4 me-2" />
                      {isSubmitting ? 'Saving...' : 'Save Entries'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                {productSearch ? (
                  <p>No products match your search</p>
                ) : (
                  <>
                    <p>No products assigned to this line</p>
                    <p className="text-sm mt-2">Go to Admin → Products to assign products to this line</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center gap-1">
                          Code
                          <SortIcon field="code" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Product
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Unit
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('userToday')}
                      >
                        <div className="flex items-center gap-1">
                          My Total Today
                          <SortIcon field="userToday" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('globalToday')}
                      >
                        <div className="flex items-center gap-1">
                          All Users Today
                          <SortIcon field="globalToday" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{product.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.category && (
                            <div className="text-xs text-gray-500">
                              {product.category}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={productEntries[product.id]?.quantity || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value, product.unit_of_measure)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={productEntries[product.id]?.unit_of_measure || product.unit_of_measure}
                            onChange={(e) => handleUnitChange(product.id, e.target.value, product.unit_of_measure)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            {UNIT_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            {productTotals[product.id]?.userToday || 0}
                            <span className="text-xs text-gray-500 ms-1">
                              {product.unit_of_measure}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {productTotals[product.id]?.globalToday || 0}
                            <span className="text-xs text-gray-500 ms-1">
                              {product.unit_of_measure}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredAndSortedProducts.length > 0 && hasEntries && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="w-4 h-4 me-2" />
                  {isSubmitting ? 'Saving...' : 'Save Entries'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 mb-6">
            <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select a production line to enter production data</p>
          </div>
        )}

        {/* History Section */}
        {showHistory && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">{t('production.recentEntries')}</h3>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>{t('production.noEntries')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('production.dateTime')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('production.line')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('production.product')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('production.quantity')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('production.recordedBy')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.lines?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.lines?.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.products?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.products?.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.quantity} {entry.unit_of_measure}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.profiles?.full_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
