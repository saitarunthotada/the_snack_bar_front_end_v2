import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import CustomerIdentityModal from '../../components/CustomerIdentityModal'
import { productApi, zoneApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import {
  ChevronLeft, ChevronRight, MessageCircle, Phone,
  Navigation, ArrowDown, Shield, Lock, Truck,
  MapPin, Star, Clock, CheckCircle, Bike,
  ExternalLink, BadgeCheck,
  Package, Sparkles, LogIn, AlertCircle, School,
  Radio,
} from 'lucide-react'
import './StorePage.css'

const PAGE_SIZE = 12
const PHONE = '919849871622'
const WHATSAPP_MSG = encodeURIComponent('Hi! I have a question about my order.')
const WHATSAPP_AREA_MSG = encodeURIComponent("Hi! I'd like to check if you deliver to my area.")
const STALL_MAPS_URL = 'https://maps.app.goo.gl/YMzNUgBoYs5MW4EJA'

// ── Stall hours (IST) — change these two lines to update hours ──
const OPEN_HOUR  = 11   // 11:00 AM
const CLOSE_HOUR = 19   // 7:00 PM

function getStallStatus() {
  const now = new Date()
  // Convert to IST (UTC+5:30)
  const ist = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + 5.5 * 60 * 60 * 1000)
  const totalMinutes   = ist.getHours() * 60 + ist.getMinutes()
  const openMinutes    = OPEN_HOUR  * 60
  const closeMinutes   = CLOSE_HOUR * 60

  if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
    const minsLeft = closeMinutes - totalMinutes
    if (minsLeft <= 30) {
      return { open: true, label: `Closing soon · closes at ${CLOSE_HOUR % 12 || 12} PM` }
    }
    return {
      open: true,
      label: `Open Now · ${OPEN_HOUR % 12 || 12} AM – ${CLOSE_HOUR % 12 || 12} PM`,
    }
  }

  if (totalMinutes < openMinutes) {
    const minsUntil = openMinutes - totalMinutes
    if (minsUntil <= 60) {
      const h = Math.floor(minsUntil / 60)
      const m = minsUntil % 60
      const parts = [...(h ? [`${h}h`] : []), ...(m ? [`${m}m`] : [])]
      return { open: false, label: `Closed · Opens in ${parts.join(' ')}` }
    }
    return { open: false, label: `Closed · Opens today at ${OPEN_HOUR % 12 || 12} AM` }
  }

  // Past closing time
  return { open: false, label: `Closed · Reopens tomorrow at ${OPEN_HOUR % 12 || 12} AM` }
}

const STALL_LOCATIONS = [
  {
    name: 'A.U. Outgate Stall',
    address: 'Andhra University Out Gate, Waltair, Visakhapatnam',
    note: 'Main stall — open daily',
    mapsUrl: STALL_MAPS_URL,
  },
]

const PRIVACY_POINTS = [
  { icon: Lock,        text: 'Your name and phone are used only for order processing and delivery coordination.' },
  { icon: Shield,      text: 'We never sell, share, or trade your personal information with third parties.' },
  { icon: CheckCircle, text: 'Location data (if shared) is used solely to pin your delivery address and is not stored permanently.' },
  { icon: Clock,       text: 'Order data is retained only as long as necessary to fulfil and support your order.' },
]

export default function StorePage() {
  const { cartId } = useCart()
  const [products, setProducts]                 = useState([])
  const [total, setTotal]                       = useState(0)
  const [page, setPage]                         = useState(0)
  const [loading, setLoading]                   = useState(true)
  const [showModal, setShowModal]               = useState(false)
  const [pendingProductId, setPendingProductId] = useState(null)
  const [zones, setZones]                       = useState([])
  const [stallStatus, setStallStatus]           = useState(getStallStatus)

  const productsRef = useRef(null)
  const totalPages  = Math.ceil(total / PAGE_SIZE)

  // Re-check stall status every minute so it updates live
  useEffect(() => {
    const id = setInterval(() => setStallStatus(getStallStatus()), 60_000)
    return () => clearInterval(id)
  }, [])

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

  useEffect(() => {
    zoneApi.getActive().then(setZones).catch(() => {})
  }, [])

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

      {/* ── HERO ── */}
      <header className="store-hero">
        <div className="hero-bg-orbs" aria-hidden="true" />

        <div className="store-hero-inner">
          <div className="hero-eyebrow">
            <Sparkles size={11} strokeWidth={2.2} />
            Chocodew Treats · Vizag
          </div>
          <h1 className="hero-title">
            The <em>Snack</em> Bar
          </h1>
          <p className="hero-sub">
            Handcrafted chocolates &amp; premium treats,<br />freshly prepared and delivered across Vizag
          </p>
          <div className="hero-actions">
            <button className="hero-cta hero-cta--primary" onClick={scrollToProducts}>
              Shop Now <ArrowDown size={14} strokeWidth={2.5} />
            </button>
            {!cartId && (
              <button className="hero-cta hero-cta--ghost" onClick={() => handleNeedIdentity(null)}>
                <LogIn size={14} strokeWidth={2} /> Sign In
              </button>
            )}
          </div>

          <div className="hero-trust">
            <div className="trust-item"><Truck size={13} strokeWidth={2} /> Free delivery in Vizag</div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item"><BadgeCheck size={13} strokeWidth={2} /> Fresh daily</div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item"><Star size={12} strokeWidth={2} fill="currentColor" /> Premium quality</div>
          </div>
        </div>
      </header>

      {/* ── CONTACT BAR ── */}
      <div className="contact-bar">
        <AlertCircle size={13} strokeWidth={2} className="contact-bar-icon" />
        <span className="contact-bar-label">
          Need a custom order for an event or help with your order?
        </span>
        <div className="contact-bar-actions">
          <a
            href={`https://wa.me/${PHONE}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn contact-btn--whatsapp"
          >
            <MessageCircle size={13} strokeWidth={2.5} /> WhatsApp Us
          </a>
          <a href={`tel:+${PHONE}`} className="contact-btn contact-btn--call">
            <Phone size={13} strokeWidth={2.5} /> Call Us
          </a>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <main className="store-main" ref={productsRef}>
        <div className="store-main-header">
          <div className="section-label-group">
            <span className="section-eyebrow">
              <Package size={10} strokeWidth={2.5} /> Fresh &amp; Available
            </span>
            <h2 className="store-section-title">Our Specials</h2>
          </div>
          {total > 0 && (
            <span className="store-section-sub">
              <CheckCircle size={11} strokeWidth={2.5} /> {total} treats available
            </span>
          )}
        </div>

        {loading ? (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-skeleton">
                <div className="skeleton" style={{ height: 190 }} />
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton" style={{ height: 20, width: '65%' }} />
                  <div className="skeleton" style={{ height: 13, width: '90%' }} />
                  <div className="skeleton" style={{ height: 13, width: '55%' }} />
                  <div className="skeleton" style={{ height: 36, marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <p>No products available right now. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 0.055}s` }}>
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
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="pagination-info">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── DELIVERY ZONES ── */}
      <section className="delivery-section">
        <div className="delivery-inner">
          <div className="delivery-header">
            <div className="delivery-header-left">
              <span className="delivery-eyebrow">
                <Bike size={11} strokeWidth={2.5} /> We deliver across
              </span>
              <h2 className="delivery-title">Delivery Zones — Vizag</h2>
              <p className="delivery-subtitle">All areas within Visakhapatnam city limits</p>
            </div>

            {STALL_LOCATIONS.map((stall) => (
              <a
                key={stall.name}
                href={stall.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stall-badge"
              >
                <span
                  className="stall-pulse-dot"
                  style={stallStatus.open ? undefined : { background: '#999', animation: 'none' }}
                />
                <div className="stall-badge-text">
                  <strong>{stall.name}</strong>
                  <span>{stallStatus.label}</span>
                </div>
                <ExternalLink size={13} className="stall-badge-icon" strokeWidth={2} />
              </a>
            ))}
          </div>

          <div className="zones-grid">
            {zones.map((zone) => (
              <div key={zone.id} className="zone-card">
                <span className="zone-icon-wrap">
                  <MapPin size={15} strokeWidth={1.8} />
                </span>
                <div className="zone-info">
                  <span className="zone-name">{zone.name}</span>
                  <span className="zone-city">{zone.city}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="delivery-note">
            <MapPin size={14} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--gold-deep)' }} />
            Don't see your area?&nbsp;
            <a
              href={`https://wa.me/${PHONE}?text=${WHATSAPP_AREA_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask us on WhatsApp <ExternalLink size={10} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
            &nbsp;— we're expanding coverage regularly.
          </div>
        </div>
      </section>

      {/* ── FOOTER / PRIVACY ── */}
      <footer className="store-footer-section">
        <div className="store-footer-inner">
          <div>
            <div className="footer-col-title">The Snack Bar</div>
            <p className="footer-text">
              Handcrafted chocolates and premium treats made with love in Visakhapatnam.
              Order online or visit us at our stall at A.U. Outgate, Vizag.
            </p>
            <div className="footer-contact-links">
              <a
                href={`https://wa.me/${PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link footer-contact-link--wa"
              >
                <MessageCircle size={13} strokeWidth={2.5} /> Chat on WhatsApp
              </a>
              <a href={`tel:+${PHONE}`} className="footer-contact-link footer-contact-link--phone">
                <Phone size={13} strokeWidth={2.5} /> +91 98498 71622
              </a>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Our Stall</div>
            {STALL_LOCATIONS.map(stall => (
              <div key={stall.name} className="footer-stall-block">
                <div className="footer-stall-name">
                  <School size={15} strokeWidth={2} />
                  <span>{stall.name}</span>
                </div>
                <p className="footer-text footer-stall-address">{stall.address}</p>
                <p
                  className="footer-stall-status"
                  style={stallStatus.open ? undefined : { color: '#888' }}
                >
                  <Radio
                    size={11}
                    strokeWidth={2.5}
                    className={stallStatus.open ? 'stall-live-icon' : undefined}
                    style={stallStatus.open ? undefined : { opacity: 0.4 }}
                  />
                  {stallStatus.label}
                </p>
                <a
                  href={stall.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-directions-link"
                >
                  <Navigation size={11} strokeWidth={2.5} /> Get Directions
                </a>
              </div>
            ))}
          </div>

          <div>
            <div className="footer-col-title">Privacy &amp; Data</div>
            <ul className="privacy-list">
              {PRIVACY_POINTS.map((pt, i) => (
                <li key={i}>
                  <pt.icon size={13} strokeWidth={2} />
                  {pt.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-divider">
          <span className="footer-copy">© {new Date().getFullYear()} The Snack Bar · All rights reserved.</span>
          <span className="footer-brand-small">Chocodew Treats</span>
        </div>
      </footer>

      {showModal && (
        <CustomerIdentityModal
          onClose={handleModalClose}
          pendingProductId={pendingProductId}
        />
      )}
    </div>
  )
}