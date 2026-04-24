// PERF BUG: AnalyticsDashboard imported eagerly — recharts (182KB) in main bundle
import { useState } from 'react'
import  AnalyticsDashboard  from './AnalyticsDashboard'
import { ProductCard } from './ProductCard'
import { SearchBar } from './SearchBar'
import { products } from '../data/products'

export function ProductList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)

  // PERF BUG: New function reference on every render — all 50 ProductCards see prop change
  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

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

      {/* PERF BUG: Always mounted, recharts always in bundle */}
      {showAnalytics && <AnalyticsDashboard products={products} />}

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
