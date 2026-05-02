import React, { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminZonesPage.css'

export default function AdminZonesPage() {
  const [zones, setZones]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [name, setName]         = useState('')
  const [city, setCity]         = useState('')
  const [adding, setAdding]     = useState(false)

  const fetchZones = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getAllZones()
      setZones(data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchZones() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim() || !city.trim()) return toast.error('Name and city are required')
    setAdding(true)
    try {
      await adminApi.createZone({ name: name.trim(), city: city.trim() })
      toast.success('Zone added!')
      setName('')
      setCity('')
      fetchZones()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (zone) => {
    setTogglingId(zone.id)
    try {
      await adminApi.toggleZone(zone.id, !zone.active)
      toast.success(`Zone ${!zone.active ? 'activated' : 'deactivated'}`)
      fetchZones()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const active   = zones.filter(z => z.active)
  const inactive = zones.filter(z => !z.active)

  return (
    <div className="admin-zones">
      <div className="az-header">
        <h1>Delivery Zones</h1>
        <span className="az-count">{zones.length} total</span>
      </div>

      {/* ── Add Zone Form ── */}
      <form className="az-add-form" onSubmit={handleAdd}>
        <h4>Add Zone</h4>
        <div className="az-form-row">
          <input
            placeholder="Zone name  e.g. MVP Colony"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            placeholder="City  e.g. Vizag"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <button type="submit" disabled={adding} className="az-add-btn">
            {adding ? <span className="spinner dark" /> : <><Plus size={14} /> Add</>}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="az-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="az-row skeleton-row">
              <div className="skeleton" style={{ height: 14, width: '30%' }} />
              <div className="skeleton" style={{ height: 14, width: '15%' }} />
            </div>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="az-empty">No zones yet — add one above</div>
      ) : (
        <>
          {[{ label: 'Active', list: active }, { label: 'Inactive', list: inactive }].map(({ label, list }) =>
            list.length > 0 && (
              <div key={label} className="az-group">
                <p className="az-group-label">{label}</p>
                <div className="az-list">
                  {list.map(zone => (
                    <div key={zone.id} className={`az-row ${zone.active ? 'az-row--active' : 'az-row--inactive'}`}>
                      <div className="az-row-info">
                        <span className="az-name">{zone.name}</span>
                        <span className="az-city">{zone.city}</span>
                      </div>
                      <button
                        className="az-toggle-btn"
                        onClick={() => handleToggle(zone)}
                        disabled={togglingId === zone.id}
                        title={zone.active ? 'Deactivate' : 'Activate'}
                      >
                        {togglingId === zone.id
                          ? <span className="spinner dark" />
                          : zone.active
                            ? <ToggleRight size={22} className="toggle-on" />
                            : <ToggleLeft  size={22} className="toggle-off" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}