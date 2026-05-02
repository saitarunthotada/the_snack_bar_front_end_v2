import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminSmsLogsPage.css'

const SMS_STATUS_CLASS = {
  SENT:    'sms-sent',
  FAILED:  'sms-failed',
  PENDING: 'sms-pending',
}

const SMS_STATUS_LABELS = {
  SENT:    '✓ Sent',
  FAILED:  '✕ Failed',
  PENDING: '⏳ Pending',
}

export default function AdminSmsLogsPage() {
  const [logs, setLogs] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const PAGE_SIZE = 10

  const fetchLogs = async (p = page, s = search) => {
    setLoading(true)
    try {
      const isUUID = /^[0-9a-fA-F\-]{4,}$/.test(s)
      const data = await adminApi.getSmsLogs({
        orderId: isUUID ? s : undefined,
        page: p,
        size: PAGE_SIZE,
      })
      // backend returns Page<AdminSmsLogResponse> directly under data.data
      setLogs(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(page, search) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchLogs(0, search)
  }

  const totalPages = Math.ceil(totalElements / PAGE_SIZE)

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="admin-sms-logs">
      <div className="asl-header">
        <h1>SMS Logs</h1>
        <span className="asl-count">{totalElements} total</span>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Search by Order ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div className="asl-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="sms-row skeleton-row">
              <div className="skeleton" style={{ height: 14, width: '30%' }} />
              <div className="skeleton" style={{ height: 14, width: '20%' }} />
              <div className="skeleton" style={{ height: 14, width: '15%' }} />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="asl-empty">No SMS logs found</div>
      ) : (
        <div className="asl-list">
          {logs.map((log, i) => (
            <div key={log.id ?? i} className="sms-row">
              <div className="sl-order-id">
                <span className="sl-id-badge">#{log.orderId?.slice(0, 8)}</span>
              </div>
              <div className="sl-phone">{log.phone || '—'}</div>
              <div className="sl-message">{log.message || '—'}</div>
              <div className="sl-right">
                <span className={`status-badge ${SMS_STATUS_CLASS[log.status] || 'sms-unknown'}`}>
                  {SMS_STATUS_LABELS[log.status] || log.status || 'Unknown'}
                </span>
                <span className="sl-date">{formatDate(log.createdAt)}</span>
              </div>
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