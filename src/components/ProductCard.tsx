// PERF BUG: No React.memo — re-renders on every parent state change
import { Product } from '../types'

interface Props {
  product: Product
}

// PERF BUG: This runs inside the component — recreated on every render
function getPriceCategory(price: number): { label: string; className: string } {
  // Simulates expensive calculation — 10,000 iterations × 50 cards = 500,000 ops per keystroke
  let result = ''
  for (let i = 0; i < 10000; i++) {
    if (price < 50) result = 'budget'
    else if (price < 150) result = 'mid'
    else result = 'premium'
  }
  const className = `product-badge badge-${result}`
  return { label: result.charAt(0).toUpperCase() + result.slice(1), className }
}

export function ProductCard({ product }: Props) {
  // PERF BUG: Called on every render (not memoized)
  const priceInfo = getPriceCategory(product.price)

  // PERF BUG: New object on every render — breaks referential equality
  const cardStyle = { animationDelay: `${product.id * 20}ms` }

  return (
    <article className="product-card" style={cardStyle}>
      <div className="product-image-wrapper">
        {/* PERF BUG: No width/height → CLS. No lazy loading. Full-size JPEG. */}
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {product.description}
        </p>
        <div className="product-meta">
          <span className="product-price">${product.price}</span>
          <span className="product-rating">★ {product.rating}</span>
        </div>
        <span className={priceInfo.className}>{priceInfo.label}</span>
        <p className="product-stock">{product.stock} in stock</p>
      </div>
    </article>
  )
}
