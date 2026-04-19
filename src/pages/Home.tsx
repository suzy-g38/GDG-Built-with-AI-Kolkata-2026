import { ProductList } from '../components/ProductList'

export default function Home() {
  return (
    <div>
      <div className="page-hero">
        <h1>
          <span className="gradient-text">ShopFast</span> Catalogue
        </h1>
        <p>50 products across 5 categories — search, filter, explore.</p>
      </div>
      <ProductList />
    </div>
  )
}
