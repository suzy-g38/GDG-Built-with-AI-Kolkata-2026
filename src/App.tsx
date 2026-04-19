import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Adaptive from './pages/Adaptive'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <a href="/" className="logo">⚡ ShopFast</a>
            <nav className="nav-links">
              <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
                Catalogue
              </NavLink>
              <NavLink to="/adaptive" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Adaptive Demo
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/adaptive" element={<Adaptive />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
