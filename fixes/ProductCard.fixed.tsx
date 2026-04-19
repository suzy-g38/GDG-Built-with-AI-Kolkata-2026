import React, { useMemo } from 'react'
import { Product } from '../types'

interface Props {
  product: Product
}

function getPriceCategory(price: number): { label: string; className: string } {
  const tier = price < 50 ? 'budget' : price < 150 ? 'mid' : 'premium'
  return {
    label: tier.charAt(0).toUpperCase() + tier.slice(1),
    className: `product-badge badge-${tier}`,
  }
}

export const ProductCard = React.memo(function ProductCard({ product }: Props) {
  const priceInfo = useMemo(() => getPriceCategory(product.price), [product.price])

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          width={280}
          height={280}
          loading="lazy"
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
})
