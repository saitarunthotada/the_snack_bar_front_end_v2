import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import CustomerIdentityModal from '../../components/CustomerIdentityModal'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { ChevronLeft, ChevronRight, MessageCircle, Phone, Navigation, ArrowDown } from 'lucide-react'
import './StorePage.css'

const PAGE_SIZE = 12
const PHONE = '919849871622'
const WHATSAPP_MSG = encodeURIComponent('Hi! I have a question about my order 🍫')
const STALL_MAPS_URL = 'https://maps.app.goo.gl/YMzNUgBoYs5MW4EJA'

const DELIVERY_ZONES = [
  { name: 'Sujatha Nagar',   emoji: '🏡' },
  { name: 'Vepagunta',       emoji: '🌿' },
  { name: 'Simhachalam',     emoji: '⛩️' },
  { name: 'Gopalapatnam',    emoji: '🏘️' },
  { name: 'NAD Junction',    emoji: '🔀' },
  { name: 'Kancharapalem',   emoji: '🛤️' },
  { name: 'Seethammadhara',  emoji: '🌳' },
  { name: 'Seethampeta',     emoji: '🏠' },
  { name: 'RTC Complex',     emoji: '🚌' },
  { name: 'Siripuram',       emoji: '🏙️' },
  { name: 'Waltair Uplands', emoji: '🌊' },
  { name: 'MVP Colony',      emoji: '🌆' },
]

export default function StorePage() {
  const { cartId } = useCart()
  const [products, setProducts]           = useState([])
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [pendingProductId, setPendingProductId] = useState(null)

  const productsRef = useRef(null)
  const totalPages  = Math.ceil(total / PAGE_SIZE)

  const fetchProducts = useCallback(async (p) => {
    setLoading(true)
    try {
      const data = await productApi.getAll(p, PAGE_SIZE)
      setProducts(data.items)
      setTotal(data.total)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts(page) }, [page, fetchProducts])

  const handleNeedIdentity = (productId) => {
    setPendingProductId(productId)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setPendingProductId(null)
  }

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="store-page">
      <Navbar />

      {/* ── HERO (slim) ── */}
      <header className="store-hero">
        <div className="store-hero-inner">
          <p className="hero-eyebrow">Chocodew Treats · Vizag</p>
          <h1 className="hero-title">The Snack Bar</h1>
          <p className="hero-sub">Chocolates &amp; treats, delivered fresh</p>
          <div className="hero-actions">
            <button className="hero-cta" onClick={scrollToProducts}>
              Order Now <ArrowDown size={15} />
            </button>
            {!cartId && (
              <button className="hero-cta hero-cta--ghost" onClick={() => handleNeedIdentity(null)}>
                Sign In
              </button>
            )}
          </div>
        </div>
        <div className="hero-drizzle" aria-hidden="true">
          {'🍫🍪🍬🌟🍫🍪🍬🌟'.split('').map((c, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>{c}</span>
          ))}
        </div>
      </header>

      {/* ── CONTACT BAR ── */}
      <div className="contact-bar">
        <span className="contact-bar-text">Need help?</span>
        <div className="contact-bar-actions">
          <a
            href={`https://wa.me/${PHONE}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn contact-btn--whatsapp"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <a href={`tel:+${PHONE}`} className="contact-btn contact-btn--call">
            <Phone size={14} />
            Call Us
          </a>
        </div>
      </div>

      {/* ── PRODUCTS (primary, above fold) ── */}
      <main className="store-main" ref={productsRef}>
        <div className="store-main-header">
          <h2 className="store-section-title">Our Specials</h2>
          {total > 0 && <p className="store-section-sub">{total} treats available</p>}
        </div>

        {loading ? (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-skeleton">
                <div className="skeleton" style={{ height: 180 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 18, width: '70%' }} />
                  <div className="skeleton" style={{ height: 13, width: '90%' }} />
                  <div className="skeleton" style={{ height: 13, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span>🍫</span>
            <p>No products available right now. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <ProductCard
                    product={p}
                    onNeedIdentity={(productId) => handleNeedIdentity(productId)}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── DELIVERY ZONES (secondary, below products) ── */}
      <section className="delivery-section">
        <div className="delivery-inner">
          <div className="delivery-header">
            <div>
              <p className="delivery-eyebrow">🛵 We deliver to</p>
              <h2 className="delivery-title">Delivery Zones — Vizag</h2>
            </div>
            <a
              href={STALL_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="stall-badge"
            >
              <span className="stall-pulse-dot" />
              <span className="stall-badge-text">
                <strong>Our Stall</strong>
                <span>A.U. Outgate, Vizag</span>
              </span>
              <Navigation size={13} className="stall-badge-icon" />
            </a>
          </div>

          <div className="zones-grid">
            {DELIVERY_ZONES.map((zone) => (
              <div key={zone.name} className="zone-pill">
                <span className="zone-emoji">{zone.emoji}</span>
                <span className="zone-name">{zone.name}</span>
              </div>
            ))}
          </div>

          <p className="delivery-note">
            Don't see your area?{' '}
            <a
              href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi! I'd like to check if you deliver to my area 📍")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask us on WhatsApp ↗
            </a>
          </p>
        </div>
      </section>

      {showModal && (
        <CustomerIdentityModal
          onClose={handleModalClose}
          pendingProductId={pendingProductId}
        />
      )}
    </div>
  )
}