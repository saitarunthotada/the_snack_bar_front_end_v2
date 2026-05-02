import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { orderApi, productApi } from '../../services/api'
import {
  ArrowLeft, MapPin, X, Navigation,
  ShoppingBag, Shield, ImageOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './CheckoutPage.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ─── Chocolate Loading Overlay ── */
const CHOCO_MESSAGES = [
  'Melting the finest dark chocolate…',
  'Wrapping your treats with care…',
  'Drizzling caramel on top…',
  'Sealing your order with love…',
  'Getting the delivery bike ready…',
]

function ChocolateLoader() {
  const [msgIdx, setMsgIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % CHOCO_MESSAGES.length), 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="choco-loader-overlay">
      <div className="choco-loader-card">
        <div className="choco-bar-wrap" aria-hidden="true">
          <svg viewBox="0 0 120 80" className="choco-bar-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="112" height="72" rx="10" fill="#3d1a00" />
            {[0,1,2,3].map(col =>
              [0,1,2].map(row => (
                <rect
                  key={`${col}-${row}`}
                  x={10 + col * 27} y={10 + row * 22}
                  width="22" height="17" rx="3"
                  fill="#5c2a00"
                  className={`choco-segment seg-${col * 3 + row}`}
                />
              ))
            )}
            <rect x="10" y="8" width="50" height="4" rx="2" fill="rgba(255,220,160,0.13)" />
          </svg>
          <div className="choco-drips" aria-hidden="true">
            {[0,1,2,3].map(i => <div key={i} className={`choco-drip drip-${i}`} />)}
          </div>
        </div>
        <p className="choco-loader-msg">{CHOCO_MESSAGES[msgIdx]}</p>
        <div className="choco-dots"><span /><span /><span /></div>
      </div>
    </div>
  )
}

/* ─── Checkout item image ── */
function CheckoutItemImage({ imageUrl, name }) {
  const [imgError, setImgError] = useState(false)
  if (imageUrl && !imgError) {
    return (
      <div className="ci-img-wrap">
        <img
          src={imageUrl}
          alt={name}
          className="ci-img"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }
  return (
    <div className="ci-img-wrap ci-img-fallback">
      <ImageOff size={13} strokeWidth={1.8} />
    </div>
  )
}

/* ─── Main Page ── */
export default function CheckoutPage() {
  const { cartId, cart, resetCart } = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [useLocation, setUseLocation] = useState(false)
  const [coords, setCoords] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageMap, setImageMap] = useState({})

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const items = cart?.items || []
  const total = cart?.totalAmount || 0

  useEffect(() => {
    productApi.getAll(0, 100).then(data => {
      const map = {}
      data.items.forEach(p => { map[p.id] = p.imageUrl })
      setImageMap(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!coords || !mapRef.current) return
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([coords.lat, coords.lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)
      mapInstanceRef.current = map
    } else {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16)
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng])
    } else {
      markerRef.current = L.marker([coords.lat, coords.lng], { draggable: true })
        .addTo(mapInstanceRef.current)
        .bindPopup('Drag to adjust your delivery pin')
        .openPopup()
      markerRef.current.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        setCoords({ lat, lng })
      })
    }
  }, [coords])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported on this device'); return }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setUseLocation(true); setLocLoading(false)
        toast.success('Location pinned! Drag the marker to adjust.')
      },
      () => { toast.error('Could not get location. Please allow location access.'); setLocLoading(false) }
    )
  }

  const handleRemoveLocation = () => {
    setUseLocation(false); setCoords(null)
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current); markerRef.current = null
    }
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!address.trim()) { toast.error('Delivery address is required'); return }
    if (!cartId) return
    setLoading(true)
    try {
      const orderData = await orderApi.place(
        cartId, address.trim(),
        useLocation && coords ? coords.lat : null,
        useLocation && coords ? coords.lng : null
      )
      resetCart()
      navigate('/order-success', { state: { order: orderData } })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!cartId || items.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-empty">
          <ShoppingBag size={52} color="var(--choco-300)" />
          <h2>Nothing to checkout</h2>
          <p>Add some treats from the store first.</p>
          <Link to="/" className="back-link">← Browse Treats</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      {loading && <ChocolateLoader />}
      <Navbar />
      <div className="checkout-inner">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={15} /> Back to Cart
        </Link>

        <h1 className="checkout-page-title">Checkout</h1>

        <div className="checkout-layout">
          {/* ── FORM ── */}
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon"><MapPin size={17} /></div>
                <h2 className="form-section-title">Delivery Details</h2>
              </div>
              <div className="field-group">
                <label className="field-label">
                  <MapPin size={11} />
                  Delivery Address
                  <span className="required-star">★</span>
                  <span className="mandatory-badge">Required</span>
                </label>
                <div className="field-input-wrap">
                  <span className="field-input-icon" style={{ top: 14 }}>
                    <MapPin size={16} />
                  </span>
                  <textarea
                    className="field-textarea"
                    rows={3}
                    placeholder="House / Flat no., Street, Area, Landmark — be as specific as possible"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
                <p className="field-hint">
                  Include your full address with door number, street and any landmark for faster delivery.
                </p>
              </div>
            </div>

            <div className="form-section">
              <div className="location-section">
                <div className="location-header">
                  <div className="form-section-icon"><Navigation size={16} /></div>
                  <div className="location-header-text">
                    <strong>Pin Your Location</strong>
                    <span>Share your GPS location for precise delivery — highly recommended</span>
                  </div>
                </div>
                <div className="loc-row">
                  <button
                    type="button"
                    className={`loc-btn ${useLocation && coords ? 'active' : ''}`}
                    onClick={handleGetLocation}
                    disabled={locLoading}
                  >
                    {locLoading ? <span className="spinner spinner--sm" /> : <Navigation size={15} />}
                    {useLocation && coords ? 'Location Pinned' : 'Use My Location'}
                  </button>
                  {useLocation && coords && (
                    <button type="button" className="loc-clear" onClick={handleRemoveLocation}>
                      <X size={13} /> Remove
                    </button>
                  )}
                </div>
                {coords && (
                  <div className="map-wrapper">
                    <div className="map-label">
                      <MapPin size={12} />
                      Your delivery pin — drag to adjust exact location
                    </div>
                    <div ref={mapRef} className="map-container" />
                    <div className="map-coords">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" className="place-order-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : <ShoppingBag size={18} />}
                {loading
                  ? 'Placing Order…'
                  : <>Place Order <span className="order-btn-total">· ₹{Number(total).toFixed(2)}</span></>
                }
              </button>
            </div>
          </form>

          {/* ── ORDER SUMMARY ── */}
          <div className="checkout-summary">
            <div className="summary-header">
              <h2>Order Summary</h2>
              <p>{items.reduce((s, i) => s + i.quantity, 0)} items</p>
            </div>

            <div className="checkout-items">
              {items.map(item => (
                <div key={item.productId} className="checkout-item">
                  <CheckoutItemImage
                    imageUrl={imageMap[item.productId]}
                    name={item.productName}
                  />
                  <span className="ci-name">
                    {item.productName}
                    <span className="ci-qty"> ×{item.quantity}</span>
                  </span>
                  <span className="ci-total">₹{Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span className="row-label">Subtotal</span>
                <span className="row-value">₹{Number(total).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="row-label">Delivery</span>
                <span className="row-value" style={{ color: 'var(--success)' }}>Free</span>
              </div>
              <div className="summary-row grand-total">
                <span className="row-label">Total</span>
                <span className="row-value">₹{Number(total).toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-security">
              <Shield size={13} />
              Your order details are secure and private
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}