import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import {
  Search,
  ChevronDown,
  ChevronUp,
  FilePlus,
  CheckCircle,
  ChefHat,
  Truck,
  PackageCheck,
  XCircle,
  Calendar,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminOrdersPage.css'
import DateTimePicker from '../../components/DateTimePicker'

const STATUS_OPTIONS = ['CREATED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

const FLOW_ORDER = ['CREATED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']

// Allowed transitions per status:
// CREATED        → CONFIRMED, CANCELLED only
// CONFIRMED+     → forward in flow (skip allowed) + CANCELLED
// DELIVERED      → dead end
// CANCELLED      → dead end
const getAllowedTransitions = (current) => {
  if (current === 'DELIVERED' || current === 'CANCELLED') return []
  if (current === 'CREATED') return ['CONFIRMED', 'CANCELLED']
  const idx = FLOW_ORDER.indexOf(current)
  const forward = FLOW_ORDER.slice(idx + 1)
  return [...forward, 'CANCELLED']
}

const STATUS_ICONS = {
  CREATED:          <FilePlus size={13} strokeWidth={2.2} />,
  CONFIRMED:        <CheckCircle size={13} strokeWidth={2.2} />,
  PREPARING:        <ChefHat size={13} strokeWidth={2.2} />,
  OUT_FOR_DELIVERY: <Truck size={13} strokeWidth={2.2} />,
  DELIVERED:        <PackageCheck size={13} strokeWidth={2.2} />,
  CANCELLED:        <XCircle size={13} strokeWidth={2.2} />,
}

const STATUS_LABELS = {
  CREATED:          'Created',
  CONFIRMED:        'Confirmed',
  PREPARING:        'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
  CANCELLED:        'Cancelled',
}

const STATUS_CLASS = {
  CREATED:          'status-created',
  CONFIRMED:        'status-confirmed',
  PREPARING:        'status-preparing',
  OUT_FOR_DELIVERY: 'status-otd',
  DELIVERED:        'status-delivered',
  CANCELLED:        'status-cancelled',
}

const StatusLabel = ({ status }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    {STATUS_ICONS[status]}
    {STATUS_LABELS[status] || status}
  </span>
)

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)   // { orderId, status } | null

  const PAGE_SIZE = 10

const fetchOrders = async (p = page, s = search, status = statusFilter, from = fromDate, to = toDate) => {
  setLoading(true)
  try {
    const trimmed = s.trim()
    
    // Heuristic: looks like a UUID fragment (hex chars + dashes) → search by ID
    const looksLikeId = /^[0-9a-f-]+$/i.test(trimmed)

    const data = await adminApi.getOrders({
      orderIdLike: (trimmed && looksLikeId)  ? trimmed : undefined,
      name:        (trimmed && !looksLikeId) ? trimmed : undefined,
      status:      status || undefined,
      fromDate:    from   || undefined,
      toDate:      to     || undefined,
      page:        p,
      size:        PAGE_SIZE,
    })
    setOrders(data.content || [])
    setTotalElements(data.totalElements || 0)
  } catch (err) {
    console.error(err)
    toast.error(err.message)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchOrders(page, search, statusFilter, fromDate, toDate) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchOrders(0, search, statusFilter, fromDate, toDate)
  }

  const handleStatusFilter = (status) => {
    const next = status === statusFilter ? null : status
    setStatusFilter(next)
    setPage(0)
    fetchOrders(0, search, next, fromDate, toDate)
  }

  const handleDateApply = () => {
    setPage(0)
    fetchOrders(0, search, statusFilter, fromDate, toDate)
  }

  const handleDateClear = () => {
    setFromDate('')
    setToDate('')
    setPage(0)
    fetchOrders(0, search, statusFilter, '', '')
  }

  const hasDateFilter = fromDate || toDate

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId({ orderId, status: newStatus })
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
      toast.success('Status updated!')
      fetchOrders(page, search, statusFilter, fromDate, toDate)
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
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="admin-orders">
      <div className="ao-header">
        <h1>Orders</h1>
        <span className="ao-count">{totalElements} total</span>
      </div>

      {/* ── Search ── */}
      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Search by Id, name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {/* ── Date Range Filter ── */}
      <div className="ao-date-filter">
        <div className="date-filter-inner">
          <Calendar size={15} className="date-filter-icon" />
          <DateTimePicker
            placeholder="Start date & time"
            value={fromDate}
            onChange={(iso) => setFromDate(iso)}
          />
          <span className="date-filter-sep">→</span>
          <DateTimePicker
            placeholder="End date & time"
            value={toDate}
            onChange={(iso) => setToDate(iso)}
          />
          <button
            type="button"
            className="date-apply-btn"
            onClick={handleDateApply}
          >
            Apply
          </button>
          {hasDateFilter && (
            <button
              type="button"
              className="date-clear-btn"
              onClick={handleDateClear}
              title="Clear date filter"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Status Filter Pills ── */}
      <div className="ao-filter-pills">
        <button
          className={`filter-pill ${statusFilter === null ? 'filter-pill--active' : ''}`}
          onClick={() => handleStatusFilter(null)}
        >
          All
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`filter-pill filter-pill--${s.toLowerCase().replace(/_/g, '-')} ${statusFilter === s ? 'filter-pill--active' : ''}`}
            onClick={() => handleStatusFilter(s)}
          >
            <StatusLabel status={s} />
          </button>
        ))}
      </div>

      {/* ── List ── */}
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
                    <StatusLabel status={order.status} />
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
                        {getAllowedTransitions(order.status).map(s => {
                            const isThisUpdating =
                              updatingId?.orderId === order.orderId &&
                              updatingId?.status === s
                            const anyUpdating = updatingId?.orderId === order.orderId
                            return (
                              <button
                                key={s}
                                className={`status-btn ${STATUS_CLASS[s]}`}
                                onClick={() => handleStatusChange(order.orderId, s)}
                                disabled={anyUpdating}
                              >
                                {isThisUpdating
                                  ? <span className="spinner dark" />
                                  : <StatusLabel status={s} />
                                }
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ) : (
                    <p className="od-final">
                      This order is in a final state and cannot be changed.
                    </p>
                  )}

                  <div className="od-sms-status">
                    <h4>SMS</h4>
                    <span className={`status-badge sms-${(order.smsStatus || 'UNKNOWN').toLowerCase()}`}>
                      {order.smsStatus || 'N/A'}
                    </span>
                  </div>
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