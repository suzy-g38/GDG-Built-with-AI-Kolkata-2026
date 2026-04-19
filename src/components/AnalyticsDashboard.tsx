import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { Product } from '../types'

interface Props {
  products: Product[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export function AnalyticsDashboard({ products }: Props) {
  const totalRevenue = products.reduce((s, p) => s + p.price, 0)
  const avgRating = products.reduce((s, p) => s + p.rating, 0) / products.length
  const totalStock = products.reduce((s, p) => s + p.stock, 0)

  const categoryMap = products.reduce<Record<string, { count: number; revenue: number; rating: number }>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = { count: 0, revenue: 0, rating: 0 }
    acc[p.category].count++
    acc[p.category].revenue += p.price
    acc[p.category].rating += p.rating
    return acc
  }, {})

  const categoryData = Object.entries(categoryMap).map(([name, d]) => ({
    name,
    count: d.count,
    revenue: Math.round(d.revenue),
    avgRating: Math.round((d.rating / d.count) * 10) / 10,
  }))

  const topCategory = [...categoryData].sort((a, b) => b.count - a.count)[0]

  const priceRanges = [
    { range: '$0–50',    count: products.filter(p => p.price < 50).length },
    { range: '$50–100',  count: products.filter(p => p.price >= 50 && p.price < 100).length },
    { range: '$100–150', count: products.filter(p => p.price >= 100 && p.price < 150).length },
    { range: '$150–200', count: products.filter(p => p.price >= 150 && p.price < 200).length },
    { range: '$200+',    count: products.filter(p => p.price >= 200).length },
  ]

  // Simulated revenue trend (last 7 days)
  const revenueTrend = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    revenue: Math.round(1200 + Math.sin(i * 0.9) * 400 + Math.random() * 200),
    orders: Math.round(18 + Math.sin(i * 0.7) * 6),
  }))

  return (
    <div className="analytics-dashboard">
      <h2 className="analytics-title">
        <span>📊</span> Analytics Dashboard
      </h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-value">{products.length}</span>
          <span className="metric-label">Total Products</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">${totalRevenue.toLocaleString()}</span>
          <span className="metric-label">Catalogue Value</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{avgRating.toFixed(1)}★</span>
          <span className="metric-label">Avg Rating</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{topCategory?.name}</span>
          <span className="metric-label">Top Category</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{totalStock.toLocaleString()}</span>
          <span className="metric-label">Units in Stock</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{categoryData.length}</span>
          <span className="metric-label">Categories</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <p className="chart-title">Revenue by Category</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={45}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title">Price Distribution</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceRanges} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title">Revenue Trend (7 days)</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <p className="chart-title">Products per Category</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
