import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import CustomerIdentityModal from '../../components/CustomerIdentityModal'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import {
  ChevronLeft, ChevronRight, MessageCircle, Phone,
  Navigation, ArrowDown, Shield, Lock, Truck,
  MapPin, Star, Clock, CheckCircle, Bike,
  Home, Leaf, Landmark, Building2, ArrowLeftRight,
  Train, TreePine, School, Bus, Building,
  Waves, LayoutGrid, Package, Sparkles,
  LogIn, AlertCircle, ExternalLink, BadgeCheck
} from 'lucide-react'
import './StorePage.css'

const PAGE_SIZE = 12
const PHONE = '919849871622'
const WHATSAPP_MSG = encodeURIComponent('Hi! I have a question about my order 🍫')
const STALL_MAPS_URL = 'https://maps.app.goo.gl/YMzNUgBoYs5MW4EJA'

const DELIVERY_ZONES = [
  { name: 'Sujatha Nagar',   Icon: Home },
  { name: 'Vepagunta',       Icon: Leaf },
  { name: 'Simhachalam',     Icon: Landmark },
  { name: 'Gopalapatnam',    Icon: Building2 },
  { name: 'NAD Junction',    Icon: ArrowLeftRight },
  { name: 'Kancharapalem',   Icon: Train },
  { name: 'Seethammadhara',  Icon: TreePine },
  { name: 'Seethampeta',     Icon: Home },
  { name: 'RTC Complex',     Icon: Bus },
  { name: 'Siripuram',       Icon: Building },
  { name: 'Waltair Uplands', Icon: Waves },
  { name: 'MVP Colony',      Icon: LayoutGrid },
]

const STALL_LOCATIONS = [
  {
    name: 'A.U. Outgate Stall',
    address: 'Andhra University Out Gate, Waltair, Visakhapatnam',
    note: 'Main stall — open daily',
    mapsUrl: STALL_MAPS_URL,
    status: 'Open Now',
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
                <span className="stall-pulse-dot" />
                <div className="stall-badge-text">
                  <strong>{stall.name}</strong>
                  <span>{stall.address}</span>
                </div>
                <ExternalLink size={13} className="stall-badge-icon" strokeWidth={2} />
              </a>
            ))}
          </div>

          <div className="zones-grid">
            {DELIVERY_ZONES.map(({ name, Icon }) => (
              <div key={name} className="zone-card">
                <span className="zone-icon-wrap">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                <div className="zone-info">
                  <span className="zone-name">{name}</span>
                  <span className="zone-city">Vizag</span>
                </div>
              </div>
            ))}
          </div>

          <div className="delivery-note">
            <MapPin size={14} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--gold-deep)' }} />
            Don't see your area?&nbsp;
            <a
              href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi! I'd like to check if you deliver to my area 📍")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask us on WhatsApp <ExternalLink size={10} strokeWidth={2.5} style={{ display:'inline', verticalAlign:'middle' }} />
            </a>
            &nbsp;— we're expanding coverage regularly.
          </div>
        </div>
      </section>

      {/* ── FOOTER / PRIVACY ── */}
      <footer className="store-footer-section">
        <div className="store-footer-inner">
          {/* Brand col */}
          <div>
            <div className="footer-col-title">The Snack Bar</div>
            <p className="footer-text">
              Handcrafted chocolates and premium treats made with love in Visakhapatnam.
              Order online or visit us at our stall at A.U. Outgate, Vizag.
            </p>
            <div className="footer-contact-links">
              <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noopener noreferrer" className="footer-contact-link footer-contact-link--wa">
                <MessageCircle size={13} strokeWidth={2.5} /> Chat on WhatsApp
              </a>
              <a href={`tel:+${PHONE}`} className="footer-contact-link footer-contact-link--phone">
                <Phone size={13} strokeWidth={2.5} /> +91 98498 71622
              </a>
            </div>
          </div>

          {/* Stall locations col */}
          <div>
            <div className="footer-col-title">Our Stall</div>
            {STALL_LOCATIONS.map(stall => (
              <div key={stall.name} className="footer-stall-block">
                <div className="footer-stall-name">
                  <School size={15} strokeWidth={2} />
                  <span>{stall.name}</span>
                </div>
                <p className="footer-text footer-stall-address">{stall.address}</p>
                <p className="footer-stall-status">
                  <span className="stall-live-dot" />
                  {stall.status}
                </p>
                <a href={stall.mapsUrl} target="_blank" rel="noopener noreferrer" className="footer-directions-link">
                  <Navigation size={11} strokeWidth={2.5} /> Get Directions
                </a>
              </div>
            ))}
          </div>

          {/* Privacy col */}
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