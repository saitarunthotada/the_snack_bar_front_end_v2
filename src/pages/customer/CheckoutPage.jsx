import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { orderApi } from '../../services/api'
import { ArrowLeft, MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './CheckoutPage.css'

// fix leaflet default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function CheckoutPage() {
  const { cartId, cart, resetCart } = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [useLocation, setUseLocation] = useState(false)
  const [coords, setCoords] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const mapRef = useRef(null)       // DOM node
  const mapInstanceRef = useRef(null) // Leaflet map instance
  const markerRef = useRef(null)

  const items = cart?.items || []
  const total = cart?.totalAmount || 0

  // init or update map when coords change
// init or update map when coords change
useEffect(() => {
  if (!coords || !mapRef.current) return

  if (!mapInstanceRef.current) {
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([coords.lat, coords.lng], 16)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
  } else {
    mapInstanceRef.current.setView([coords.lat, coords.lng], 16)
  }

  if (markerRef.current) {
    markerRef.current.setLatLng([coords.lat, coords.lng])
  } else {
    markerRef.current = L.marker([coords.lat, coords.lng], { draggable: true }) // ← draggable
      .addTo(mapInstanceRef.current)
      .bindPopup('📍 Drag to adjust delivery location')
      .openPopup()

    // update coords state when marker is dragged
    markerRef.current.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      setCoords({ lat, lng })
    })
  }
}, [coords])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setUseLocation(true)
        setLocLoading(false)
        toast.success('Location captured!')
      },
      () => {
        toast.error('Could not get location')
        setLocLoading(false)
      }
    )
  }

  const handleRemoveLocation = () => {
    setUseLocation(false)
    setCoords(null)
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!address.trim()) {
      toast.error('Please enter delivery address')
      return
    }
    if (!cartId) return
    setLoading(true)
    try {
      const orderData = await orderApi.place(
        cartId,
        address.trim(),
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
          <h2>Nothing to checkout</h2>
          <Link to="/" className="back-link">← Go to Store</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-inner">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={18} /> Back to Cart
        </Link>
        <h1>Checkout</h1>

        <div className="checkout-layout">
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <h2>Delivery Details</h2>

            <label>
              Delivery Address *
              <textarea
                rows={3}
                placeholder="Full address for delivery…"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </label>

            <div className="location-row">
              <button
                type="button"
                className={`loc-btn ${useLocation && coords ? 'active' : ''}`}
                onClick={handleGetLocation}
                disabled={locLoading}
              >
                {locLoading ? <span className="spinner dark" /> : <MapPin size={16} />}
                {useLocation && coords ? 'Location Captured ✓' : 'Share My Location (Optional)'}
              </button>
              {useLocation && coords && (
                <button type="button" className="loc-clear" onClick={handleRemoveLocation}>
                  <X size={14} /> Remove
                </button>
              )}
            </div>

            {/* MAP */}
            {coords && (
              <div className="map-wrapper">
                <div className="map-label">
                  <MapPin size={13} />
                  Delivery pin — drag map to explore
                </div>
                <div ref={mapRef} className="map-container" />
                <div className="map-coords">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </div>
              </div>
            )}

            <button type="submit" className="place-order-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Placing Order…' : `Place Order · ₹${Number(total).toFixed(2)}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {items.map(item => (
                <div key={item.productId} className="checkout-item">
                  <span className="ci-name">
                    {item.productName} <span className="ci-qty">×{item.quantity}</span>
                  </span>
                  <span className="ci-total">₹{Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="checkout-total">
              <span>Total</span>
              <span>₹{Number(total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}