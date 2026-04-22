import React, { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../services/api'
import { Plus, Pencil, Trash2, Search, ImageOff, X, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminProductsPage.css'

const EMPTY_FORM = { name: '', description: '', price: '', active: true }

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [invModal, setInvModal] = useState(null)
  const [invForm, setInvForm] = useState({ quantity: 0 })
  const fileRef = useRef()

  const PAGE_SIZE = 10

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setShowForm(false)
      setInvModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const fetchProducts = async (p = page, s = search) => {
    setLoading(true)
    try {
      const data = await adminApi.getProducts(s, p, PAGE_SIZE)
      setProducts(data.items)
      setTotal(data.total)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts(page, search) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchProducts(0, search)
  }

  const openCreate = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description || '', price: p.price, active: p.active })
    setImageFile(null)
    setImagePreview(p.imageUrl || null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { toast.error('Name and price required'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        ...(editProduct ? { active: form.active } : {})
      }
      if (editProduct) {
        await adminApi.updateProduct(editProduct.id, payload, imageFile)
        toast.success('Product updated!')
      } else {
        await adminApi.createProduct(payload, imageFile)
        toast.success('Product created!')
      }
      setShowForm(false)
      fetchProducts(0, search)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await adminApi.deleteProduct(id)
      toast.success('Deleted')
      fetchProducts(0, search)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openInventory = (p) => {
    setInvModal(p)
    setInvForm({ quantity: p.quantity })
  }

  const handleInventorySave = async () => {
    try {
      await adminApi.updateInventory(invModal.id, invForm.quantity)
      toast.success('Inventory updated!')
      setInvModal(null)
      fetchProducts(page, search)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="admin-products">
      <div className="ap-header">
        <h1>Products</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={15} />
        <input
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div className="ap-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="product-admin-card skeleton-card">
              <div className="skeleton" style={{ height: 150 }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 15, width: '65%' }} />
                <div className="skeleton" style={{ height: 13, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="ap-empty">No products found</div>
      ) : (
        <div className="ap-grid">
          {products.map(p => (
            <div key={p.id} className={`product-admin-card ${!p.active ? 'inactive' : ''}`}>
              <div className="pac-image">
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} />
                  : <div className="pac-no-img"><ImageOff size={26} /></div>
                }
                <span className={`pac-status ${p.active ? 'avail' : 'unavail'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="pac-body">
                <h3>{p.name}</h3>
                <div className="pac-meta">
                  <span className="pac-price">₹{Number(p.price).toFixed(2)}</span>
                  <span className="pac-qty">Stock: {p.quantity}</span>
                </div>
                <div className="pac-actions">
                  <button type="button" className="pac-btn" onClick={() => openInventory(p)} title="Update Inventory">
                    <ToggleLeft size={14} /> Stock
                  </button>
                  <button type="button" className="pac-btn" onClick={() => openEdit(p)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="pac-btn danger" onClick={() => handleDelete(p.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="ap-pagination">
          <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-box modal-box--compact" onClick={e => e.stopPropagation()}>
            <div className="mbox-header">
              <h2>{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="modal-form modal-form--compact">

              {/* Image + Name/Price side by side */}
              <div className="form-row-top">
                <div
                  className="image-upload-area image-upload-area--small"
                  onClick={() => fileRef.current?.click()}
                  title="Click to upload"
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div className="iua-placeholder iua-placeholder--small">
                        <ImageOff size={18} />
                        <span>Image</span>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleImageChange} />
                </div>

                <div className="form-col-right">
                  <label className="field-label">
                    Name *
                    <input
                      className="field-input"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Product name"
                      required
                    />
                  </label>
                  <label className="field-label">
                    Price (₹) *
                    <input
                      className="field-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Description full-width */}
              <label className="field-label">
                Description
                <textarea
                  className="field-input"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional short description"
                />
              </label>

              {/* Active toggle (edit only) */}
              {editProduct && (
                <div className="toggle-row">
                  <span className="field-label" style={{ margin: 0 }}>Active</span>
                  <button type="button" className="toggle-btn" onClick={() => setForm(p => ({ ...p, active: !p.active }))}>
                    {form.active
                      ? <ToggleRight size={28} style={{ color: '#1a7a40' }} />
                      : <ToggleLeft  size={28} style={{ color: '#c0a080' }} />
                    }
                  </button>
                </div>
              )}

              <button type="submit" className="modal-submit" disabled={saving}>
                {saving ? <span className="spinner" /> : (editProduct ? 'Save Changes' : 'Create Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY MODAL */}
      {invModal && (
        <div className="modal-backdrop" onClick={() => setInvModal(null)}>
          <div className="modal-box modal-box--compact" onClick={e => e.stopPropagation()}>
            <div className="mbox-header">
              <h2>Update Stock</h2>
              <button type="button" onClick={() => setInvModal(null)}><X size={18} /></button>
            </div>
            <p className="inv-product-name">{invModal.name}</p>
            <div className="modal-form modal-form--compact">
              <label className="field-label">
                Quantity
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  value={invForm.quantity}
                  onChange={e => setInvForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                />
              </label>
              <button type="button" className="modal-submit" onClick={handleInventorySave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}