'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { createClient } from '@/shared/lib/supabase/client'
import { useTranslation } from '@/shared/i18n'
import { Product } from '@/shared/types/database'
import { Plus, Edit, Trash2, Upload, Database } from 'lucide-react'
import { ProductModal } from './ProductModal'
import { UploadModal } from './UploadModal'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { t } = useTranslation()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (!error && data) {
      setProducts(data)
    }
    setIsLoading(false)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false)
  }

  const handleSave = async () => {
    await fetchProducts()
    handleModalClose()
  }

  const handleUploadSave = async () => {
    await fetchProducts()
    handleUploadModalClose()
  }

  const toggleProductStatus = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (!error) {
      fetchProducts()
    }
  }

  return (
    <div>
      <Header title={t('admin.products.title')} />

      <div className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <p className="text-gray-600">
            {t('admin.products.description')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 me-2" />
              {t('admin.products.importCSV')}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 me-2" />
              {t('admin.products.addProduct')}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">{t('admin.products.noProducts')}</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 me-2" />
                  {t('admin.products.importFromCSV')}
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 me-2" />
                  {t('admin.products.addManually')}
                </Button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.products.name')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.products.code')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.products.category')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.products.unitOfMeasure')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.category || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.unit_of_measure}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product)}
                          className={`p-1 ${
                            product.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={product.is_active ? t('common.inactive') : t('common.active')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal
          onClose={handleUploadModalClose}
          onSave={handleUploadSave}
        />
      )}
    </div>
  )
}
