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
  const [editProduct, setEditProduct] = useState(null) // null = create
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [invModal, setInvModal] = useState(null) // product for inventory update
  const [invForm, setInvForm] = useState({ quantity: 0 })
  const fileRef = useRef()

  const PAGE_SIZE = 10

  const fetchProducts = async (p = page, s = search) => {
    setLoading(true)
    try {
      const data = await adminApi.getProducts(s, p, PAGE_SIZE)
      // data: { items: AdminProductResponse[], total, page, size }
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
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} />
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
              <div className="skeleton" style={{ height: 140 }} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 16, width: '60%' }} />
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
                  : <div className="pac-no-img"><ImageOff size={24} /></div>
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
                  <button className="pac-btn" onClick={() => openInventory(p)} title="Update Inventory">
                    <ToggleLeft size={15} /> Inventory
                  </button>
                  <button className="pac-btn" onClick={() => openEdit(p)} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="pac-btn danger" onClick={() => handleDelete(p.id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
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

      {/* CREATE / EDIT FORM MODAL */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="mbox-header">
              <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {/* Image upload */}
              <div className="image-upload-area" onClick={() => fileRef.current?.click()}>
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  : <div className="iua-placeholder"><ImageOff size={28} /><span>Click to upload image (optional)</span></div>
                }
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleImageChange} />
              </div>
              {imageFile && <p className="img-hint">New image selected: {imageFile.name}</p>}

              <label>
                Product Name *
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </label>
              <label>
                Description
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </label>
              <label>
                Price (₹) *
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
              </label>
              {editProduct && (
                <label className="toggle-label">
                  <span>Active</span>
                  <button type="button" className="toggle-btn" onClick={() => setForm(p => ({ ...p, active: !p.active }))}>
                    {form.active ? <ToggleRight size={28} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={28} style={{ color: 'var(--choco-300)' }} />}
                  </button>
                </label>
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
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="mbox-header">
              <h2>Update Inventory</h2>
              <button onClick={() => setInvModal(null)}><X size={20} /></button>
            </div>
            <p className="inv-product-name">{invModal.name}</p>
            <div className="modal-form">
              <label>
                Stock Quantity
                <input
                  type="number"
                  min="0"
                  value={invForm.quantity}
                  onChange={e => setInvForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                />
              </label>

              <button className="modal-submit" onClick={handleInventorySave}>
                Save Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
