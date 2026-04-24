import React, { useState, lazy, Suspense, useCallback } from 'react'
import { ProductCard } from './ProductCard'
import { SearchBar } from './SearchBar'
import { products } from '../data/products'

const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'))

export function ProductList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <button
        className="analytics-toggle-btn"
        onClick={() => setShowAnalytics(s => !s)}
      >
        <span>{showAnalytics ? '▲' : '▼'}</span>
        {showAnalytics ? 'Hide Analytics' : 'Show Analytics Dashboard'}
      </button>

      <Suspense fallback={<div className="analytics-loader"><span className="spinner" />Loading analytics...</div>}>
        {showAnalytics && <AnalyticsDashboard products={products} />}
      </Suspense>

      <div className="results-header">
        <SearchBar value={searchTerm} onChange={handleSearch} resultCount={products.length} />
        <p className="results-count">
          Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong> products
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
