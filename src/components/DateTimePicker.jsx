import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, Calendar, X } from 'lucide-react'
import './DateTimePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function DateTimePicker({ value, onChange, placeholder = 'Select date & time', label }) {
  const parsed = value ? new Date(value) : null

  const [open, setOpen] = useState(false)
  const [view, setView] = useState('calendar')
  const [viewYear, setViewYear] = useState((parsed || new Date()).getFullYear())
  const [viewMonth, setViewMonth] = useState((parsed || new Date()).getMonth())

  const [selDate, setSelDate] = useState(parsed ? {
    y: parsed.getFullYear(),
    m: parsed.getMonth(),
    d: parsed.getDate(),
  } : null)
  const [selHour, setSelHour] = useState(parsed ? parsed.getHours() : 0)
  const [selMin, setSelMin]   = useState(parsed ? parsed.getMinutes() : 0)

  const ref = useRef()
  const hourRef = useRef()
  const minRef  = useRef()

  // ── Sync internal state when value is cleared externally ──
  useEffect(() => {
    if (!value) {
      setSelDate(null)
      setSelHour(0)
      setSelMin(0)
      setView('calendar')
    }
  }, [value])

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // scroll hour/min columns to selected
  useEffect(() => {
    if (view === 'time' && open) {
      scrollTo(hourRef, selHour)
      scrollTo(minRef, selMin)
    }
  }, [view, open])

  const scrollTo = (ref, idx) => {
    if (!ref.current) return
    const item = ref.current.children[idx]
    if (item) item.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const emit = (date, h, m) => {
    if (!date) return
    const iso = `${date.y}-${pad(date.m + 1)}-${pad(date.d)}T${pad(h)}:${pad(m)}:00`
    onChange(iso)
  }

  const handleDayClick = (d) => {
    const next = { y: viewYear, m: viewMonth, d }
    setSelDate(next)
    emit(next, selHour, selMin)
    setView('time')
  }

  const handleHourClick = (h) => {
    setSelHour(h)
    emit(selDate, h, selMin)
    scrollTo(hourRef, h)
  }

  const handleMinClick = (m) => {
    setSelMin(m)
    emit(selDate, selHour, m)
    scrollTo(minRef, m)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setSelDate(null)
    setSelHour(0)
    setSelMin(0)
    onChange('')
  }

  const handleDone = () => {
    if (selDate) emit(selDate, selHour, selMin)
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const displayValue = () => {
    if (!selDate) return null
    const d = `${pad(selDate.d)} ${MONTHS[selDate.m].slice(0,3)} ${selDate.y}`
    const t = `${pad(selHour)}:${pad(selMin)}`
    return `${d}, ${t}`
  }

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth)
  const cells        = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (d) =>
    d === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const isSelected = (d) =>
    selDate && d === selDate.d && viewMonth === selDate.m && viewYear === selDate.y

  const display = displayValue()

  return (
    <div className="dtp-root" ref={ref}>
      {label && <span className="dtp-label">{label}</span>}
      <div
        className={`dtp-trigger ${open ? 'dtp-trigger--open' : ''} ${display ? 'dtp-trigger--filled' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <Calendar size={13} className="dtp-trigger-icon" />
        <span className={`dtp-trigger-text ${!display ? 'dtp-placeholder' : ''}`}>
          {display || placeholder}
        </span>
        {display
          ? <button className="dtp-clear-btn" onClick={handleClear} type="button"><X size={11} /></button>
          : <span className="dtp-chevron">{open ? '▲' : '▼'}</span>
        }
      </div>

      {open && (
        <div className="dtp-panel">
          {/* ── Tab Bar ── */}
          <div className="dtp-tabs">
            <button
              className={`dtp-tab ${view === 'calendar' ? 'dtp-tab--active' : ''}`}
              onClick={() => setView('calendar')}
              type="button"
            >
              <Calendar size={12} /> Date
            </button>
            <button
              className={`dtp-tab ${view === 'time' ? 'dtp-tab--active' : ''}`}
              onClick={() => setView('time')}
              type="button"
            >
              <Clock size={12} /> Time
            </button>
          </div>

          {view === 'calendar' && (
            <div className="dtp-calendar">
              <div className="dtp-month-nav">
                <button onClick={prevMonth} type="button" className="dtp-nav-btn">
                  <ChevronLeft size={14} />
                </button>
                <span className="dtp-month-label">
                  {MONTHS[viewMonth]} <strong>{viewYear}</strong>
                </span>
                <button onClick={nextMonth} type="button" className="dtp-nav-btn">
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="dtp-day-headers">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>

              <div className="dtp-day-grid">
                {cells.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`dtp-day
                      ${!d ? 'dtp-day--empty' : ''}
                      ${d && isToday(d) ? 'dtp-day--today' : ''}
                      ${d && isSelected(d) ? 'dtp-day--selected' : ''}
                    `}
                    onClick={() => d && handleDayClick(d)}
                    disabled={!d}
                  >
                    {d || ''}
                  </button>
                ))}
              </div>

              {selDate && (
                <div className="dtp-selected-hint">
                  Selected: <strong>{pad(selDate.d)} {MONTHS[selDate.m].slice(0,3)} {selDate.y}</strong>
                  &nbsp;—&nbsp;
                  <span className="dtp-time-hint" onClick={() => setView('time')}>
                    {pad(selHour)}:{pad(selMin)} <Clock size={10} />
                  </span>
                </div>
              )}
            </div>
          )}

          {view === 'time' && (
            <div className="dtp-time">
              <p className="dtp-time-title">Pick a time</p>
              <div className="dtp-time-columns">
                <div className="dtp-time-col">
                  <span className="dtp-time-col-label">HH</span>
                  <div className="dtp-scroll-list" ref={hourRef}>
                    {Array.from({ length: 24 }, (_, h) => (
                      <button
                        key={h}
                        type="button"
                        className={`dtp-scroll-item ${selHour === h ? 'dtp-scroll-item--sel' : ''}`}
                        onClick={() => handleHourClick(h)}
                      >
                        {pad(h)}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="dtp-time-colon">:</span>

                <div className="dtp-time-col">
                  <span className="dtp-time-col-label">MM</span>
                  <div className="dtp-scroll-list" ref={minRef}>
                    {Array.from({ length: 60 }, (_, m) => (
                      <button
                        key={m}
                        type="button"
                        className={`dtp-scroll-item ${selMin === m ? 'dtp-scroll-item--sel' : ''}`}
                        onClick={() => handleMinClick(m)}
                      >
                        {pad(m)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dtp-time-preview">
                {selDate
                  ? <>{pad(selDate.d)} {MONTHS[selDate.m].slice(0,3)}, <strong>{pad(selHour)}:{pad(selMin)}</strong></>
                  : <span style={{ color: '#c0a080' }}>Pick a date first</span>
                }
              </div>
            </div>
          )}

          <div className="dtp-footer">
            <button type="button" className="dtp-cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="dtp-done-btn" onClick={handleDone} disabled={!selDate}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}