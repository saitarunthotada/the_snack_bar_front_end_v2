import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Cookie } from 'lucide-react'
import { useCart } from '../context/CartContext'
import './Navbar.css'

export default function Navbar() {
  const { itemCount } = useCart()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
<Link to="/" className="navbar-brand">
  <img 
    src="/TheSnackBarLogo.png" 
    alt="The Snack Bar" 
    className="brand-logo"
  />

  <div className="brand-text">
    <span className="brand-name">The Snack Bar</span>
    <span className="brand-tagline">Home of Chocodew Treats</span>
  </div>
</Link>

        <Link to="/cart" className="cart-btn">
          <ShoppingCart size={20} />
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </Link>
      </div>
    </nav>
  )
}
