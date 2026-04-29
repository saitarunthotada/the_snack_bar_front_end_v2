import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminOrdersPage.css'

const STATUS_OPTIONS = ['CREATED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const STATUS_LABELS = {
  CREATED: '🆕 Created',
  CONFIRMED: '✅ Confirmed',
  PREPARING: '👨‍🍳 Preparing',
  OUT_FOR_DELIVERY: '🚚 Out for Delivery',
  DELIVERED: '🎉 Delivered',
  CANCELLED: '❌ Cancelled',
}

const STATUS_CLASS = {
  CREATED: 'status-created',
  CONFIRMED: 'status-confirmed',
  PREPARING: 'status-preparing',
  OUT_FOR_DELIVERY: 'status-otd',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const PAGE_SIZE = 10

  const fetchOrders = async (p = page, s = search) => {
    setLoading(true)

    try {
      const isUUID = /^[0-9a-fA-F\-]{4,}$/.test(s)

      const data = await adminApi.getOrders({
        orderIdLike: isUUID ? s : undefined,
        name: !isUUID ? s : undefined,
        page: p,
        size: PAGE_SIZE
      })

      setOrders(data.content || [])
      setTotalElements(data.totalElements || 0)

    } catch (err) {
      console.error(err)   // 👈 add this (important)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders(page, search) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchOrders(0, search)
  }

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      toast.success('Status updated!')
      fetchOrders(page, search)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const totalPages = Math.ceil(totalElements / PAGE_SIZE)
  const isFinal = (status) => status === 'DELIVERED' || status === 'CANCELLED'

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="admin-orders">
      <div className="ao-header">
        <h1>Orders</h1>
        <span className="ao-count">{totalElements} total</span>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Search by Id, name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div className="ao-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="order-row skeleton-row">
              <div className="skeleton" style={{ height: 18, width: '28%' }} />
              <div className="skeleton" style={{ height: 14, width: '18%' }} />
              <div className="skeleton" style={{ height: 14, width: '14%' }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="ao-empty">No orders found</div>
      ) : (
        <div className="ao-list">
          {orders.map(order => (
            <div key={order.orderId} className="order-row">
              <div
                className="order-row-main"
                onClick={() => setExpandedId(expandedId === order.orderId ? null : order.orderId)}
              >
                <div className="or-left">
                  <span className="or-id">#{order.orderId?.slice(0, 8)}</span>
                  <div>
                    <p className="or-name">{order.customerName}</p>
                    <p className="or-phone">{order.phone}</p>
                  </div>
                </div>
                <div className="or-right">
                  <span className={`status-badge ${STATUS_CLASS[order.status]}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="or-amount">₹{Number(order.totalAmount).toFixed(2)}</span>
                  <span className="or-date">{formatDate(order.createdAt)}</span>
                  {expandedId === order.orderId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedId === order.orderId && (
                <div className="order-detail">
                  <div className="od-items">
                    <h4>Items</h4>
                    {order.items?.length > 0
                      ? order.items.map((item, i) => (
                          <div key={i} className="od-item">
                            <span>{item.productName} × {item.quantity}</span>
                            <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))
                      : <p className="od-no-items">No item details</p>
                    }
                  </div>

                  {!isFinal(order.status) ? (
                    <div className="od-status-change">
                      <h4>Update Status</h4>
                      <div className="status-buttons">
                        {STATUS_OPTIONS.filter(s => s !== order.status).map(s => (
                          <button
                            key={s}
                            className={`status-btn ${STATUS_CLASS[s]}`}
                            onClick={() => handleStatusChange(order.orderId, s)}
                            disabled={updatingId === order.orderId}
                          >
                            {updatingId === order.orderId
                              ? <span className="spinner dark" />
                              : STATUS_LABELS[s]
                            }
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="od-final">This order is in a final state and cannot be changed.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="ap-pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      )}
    </div>
  )
}