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

/* ─── Constants ── */
const CHOCO_MESSAGES = [
  'Melting the finest dark chocolate…',
  'Wrapping your treats with care…',
  'Drizzling caramel on top…',
  'Sealing your order with love…',
  'Getting the delivery bike ready…',
]

const MAX_LOC_RETRIES = 5
const RETRY_DELAY_MS  = 1500

/* ─── Reverse geocode via Nominatim (free, no API key) ── */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ChocodewTreats/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address || {}

    // Build a concise, human-readable line preferring local Vizag fields
    const parts = [
      a.road || a.pedestrian || a.footway || a.path,
      a.neighbourhood || a.suburb || a.quarter || a.village || a.hamlet,
      a.city_district || a.county,
      a.city || a.town,
      a.postcode,
    ].filter(Boolean)

    return parts.length ? parts.join(', ') : (data.display_name || null)
  } catch {
    return null
  }
}

/* ─── Chocolate Loading Overlay ── */
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
        <img src={imageUrl} alt={name} className="ci-img" onError={() => setImgError(true)} />
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
  const [address, setAddress]         = useState('')
  const [useLocation, setUseLocation] = useState(false)
  const [coords, setCoords]           = useState(null)
  const [locLoading, setLocLoading]   = useState(false)
  const [locRetry, setLocRetry]       = useState(0)
  const [geocoding, setGeocoding]     = useState(false)   // reverse geocode in progress
  const [autoFilled, setAutoFilled]   = useState(false)   // was address auto-filled?
  const [loading, setLoading]         = useState(false)
  const [imageMap, setImageMap]       = useState({})

  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef      = useRef(null)
  const retryTimerRef  = useRef(null)
  const attemptRef     = useRef(0)
  const abortedRef     = useRef(false)

  const items = cart?.items || []
  const total = cart?.totalAmount || 0

  /* ── Fetch product images ── */
  useEffect(() => {
    productApi.getAll(0, 100).then(data => {
      const map = {}
      data.items.forEach(p => { map[p.id] = p.imageUrl })
      setImageMap(map)
    }).catch(() => {})
  }, [])

  /* ── Auto-request location on mount ── */
  useEffect(() => {
    if (!navigator.geolocation) return
    attemptRef.current = 0
    abortedRef.current = false
    requestLocation()
    return () => {
      abortedRef.current = true
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Core geolocation logic with retry ── */
  const requestLocation = (isManual = false) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device')
      return
    }
    setLocLoading(true)
    if (isManual) {
      attemptRef.current = 0
      abortedRef.current = false
      setLocRetry(0)
    }

    const attempt = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (abortedRef.current) return
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoords({ lat, lng })
          setUseLocation(true)
          setLocLoading(false)
          setLocRetry(0)
          if (isManual || attemptRef.current > 0) {
            toast.success('Location pinned! Drag the marker to adjust.')
          }
          // Auto-fill address from pinned coordinates
          fillAddressFromCoords(lat, lng)
        },
        (err) => {
          if (abortedRef.current) return
          if (err.code === 1) {
            abortedRef.current = true
            setLocLoading(false)
            setLocRetry(0)
            if (isManual) toast.error('Location access denied. Please allow it in browser settings.')
            return
          }
          const next = attemptRef.current + 1
          if (next < MAX_LOC_RETRIES) {
            attemptRef.current = next
            setLocRetry(next)
            retryTimerRef.current = setTimeout(attempt, RETRY_DELAY_MS)
          } else {
            setLocLoading(false)
            setLocRetry(0)
            if (isManual) toast.error('Could not get location after several tries. Enter address manually.')
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    }

    attempt()
  }

  const handleGetLocation = () => requestLocation(true)

  /* ── Reverse geocode and populate address field ── */
  const fillAddressFromCoords = async (lat, lng) => {
    setGeocoding(true)
    const result = await reverseGeocode(lat, lng)
    setGeocoding(false)
    if (result) {
      setAddress(result)
      setAutoFilled(true)
      toast.success('Address auto-filled — edit if needed', { icon: '📍' })
    }
  }

  const handleRemoveLocation = () => {
    abortedRef.current = true
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    setUseLocation(false)
    setCoords(null)
    setLocLoading(false)
    setLocRetry(0)
    setAutoFilled(false)
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
  }

  /* ── Map ── */
  useEffect(() => {
    if (!coords || !mapRef.current) return
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([coords.lat, coords.lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)
      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 50)
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
        fillAddressFromCoords(lat, lng)
      })
    }
  }, [coords])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [])

  /* ── Place order ── */
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

  /* ── Empty cart guard ── */
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

  const locBtnLabel = locLoading
    ? locRetry > 0 ? `Retrying… (${locRetry}/${MAX_LOC_RETRIES})` : 'Detecting location…'
    : useLocation && coords ? 'Location Pinned' : 'Use My Location'

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

            {/* ── SECTION 1: GPS / MAP ── */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon"><Navigation size={17} /></div>
                <div className="form-section-title-group">
                  <h2 className="form-section-title">Pin Your Location</h2>
                  <p className="form-section-sub">GPS pin helps us find you faster — recommended</p>
                </div>
              </div>

              <div className="location-section">
                <div className="loc-row">
                  <button
                    type="button"
                    className={`loc-btn ${useLocation && coords ? 'active' : ''}`}
                    onClick={handleGetLocation}
                    disabled={locLoading}
                  >
                    {locLoading
                      ? <span className="spinner spinner--sm" />
                      : <Navigation size={15} />
                    }
                    {locBtnLabel}
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

            {/* ── SECTION 2: ADDRESS ── */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon"><MapPin size={17} /></div>
                <div className="form-section-title-group">
                  <h2 className="form-section-title">Delivery Address</h2>
                  <p className="form-section-sub">Your full address for the delivery rider</p>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">
                  Address
                  <span className="required-star">★</span>
                  <span className="mandatory-badge">Required</span>
                  {autoFilled && (
                    <span className="autofill-badge">
                      <Navigation size={9} /> GPS filled
                    </span>
                  )}
                </label>
                <div className="field-input-wrap">
                  <span className="field-input-icon">
                    <MapPin size={16} />
                  </span>
                  <textarea
                    className={`field-textarea${geocoding ? ' field-textarea--loading' : ''}`}
                    rows={3}
                    placeholder={geocoding ? 'Detecting your address…' : 'House / Flat no., Street, Area, Landmark — be as specific as possible'}
                    value={address}
                    onChange={e => { setAddress(e.target.value); setAutoFilled(false) }}
                    required
                    disabled={geocoding}
                  />
                  {geocoding && (
                    <span className="field-geocoding-spinner">
                      <span className="spinner spinner--sm" />
                    </span>
                  )}
                </div>
                <p className="field-hint">
                  {autoFilled
                    ? 'Auto-filled from GPS — feel free to add more details like flat/door number.'
                    : 'Include door number, street and any landmark for faster delivery.'
                  }
                </p>
              </div>
            </div>

            {/* ── SUBMIT ── */}
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
                  <CheckoutItemImage imageUrl={imageMap[item.productId]} name={item.productName} />
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