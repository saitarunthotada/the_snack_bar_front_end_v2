import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import CustomerIdentityModal from '../../components/CustomerIdentityModal'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { ChevronLeft, ChevronRight, MessageCircle, Phone } from 'lucide-react'
import './StorePage.css'

const PAGE_SIZE = 12
const PHONE = '919849871622'
const WHATSAPP_MSG = encodeURIComponent('Hi! I have a question about my order 🍫')

export default function StorePage() {
  const { cartId } = useCart()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [pendingProductId, setPendingProductId] = useState(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)

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

  useEffect(() => {
    fetchProducts(page)
  }, [page, fetchProducts])

  const handleNeedIdentity = (productId) => {
    setPendingProductId(productId)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setPendingProductId(null)
  }

  return (
    <div className="store-page">
      <Navbar />

      <header className="store-hero">
        <div className="store-hero-inner">
          <p className="hero-eyebrow">Home of Chocodew Treats</p>
          <h1 className="hero-title">The Snack Bar</h1>
          <p className="hero-sub">Handpicked chocolates & treats delivered to your door</p>
          {!cartId && (
            <button className="hero-cta" onClick={() => handleNeedIdentity(null)}>
              Start Shopping 🍫
            </button>
          )}
        </div>
        <div className="hero-drizzle" aria-hidden="true">
          {'🍫🍪🍬🌟🍫🍪🍬🌟'.split('').map((c, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>{c}</span>
          ))}
        </div>
      </header>

      {/* CONTACT BAR */}
      <div className="contact-bar">
        <span className="contact-bar-text">Need help or have a question?</span>

        <div className="contact-bar-actions">
          <a
            href={`https://wa.me/${PHONE}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn contact-btn--whatsapp"
          >
            <MessageCircle size={16} />
            WhatsApp Us
          </a>

          <a
            href={`tel:+${PHONE}`}
            className="contact-btn contact-btn--call"
          >
            <Phone size={16} />
            Call Us
          </a>
        </div>
      </div>

      <main className="store-main">
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

      {showModal && (
        <CustomerIdentityModal
          onClose={handleModalClose}
          pendingProductId={pendingProductId}
        />
      )}
    </div>
  )
}