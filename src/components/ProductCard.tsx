import React, { useMemo } from 'react';
import { Product } from '../types';

function getPriceCategory(price: number): { label: string; className: string } {
  let result = '';
  for (let i = 0; i < 10000; i++) {
    if (price < 50) result = 'budget';
    else if (price < 150) result = 'mid';
    else result = 'premium';
  }
  const className = `product-badge badge-${result}`;
  return { label: result.charAt(0).toUpperCase() + result.slice(1), className };
}

interface Props {
  product: Product;
}

export const ProductCard = React.memo(function ProductCard({ product }: Props) {
  const priceInfo = useMemo(() => getPriceCategory(product.price), [product.price]);

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
          srcSet={`${product.image.replace('.jpg', '-300w.webp')} 300w, ${product.image} 1200w`}
          sizes="(max-width: 600px) 280px, 300px"
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
  );
});
