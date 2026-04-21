import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response unwrapper — backend wraps everything in { success, data, error }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

// ─── AUTH ───────────────────────────────────────────────────────────────────
export const authApi = {
  /** POST /api/auth/login → { success, data: "jwt-token-string" } */
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    return res.data.data // returns token string
  },
}

// ─── PRODUCTS (public) ──────────────────────────────────────────────────────
export const productApi = {
  /**
   * GET /api/products?page=0&size=20
   * → { success, data: { items: ProductResponse[], total, page, size } }
   * ProductResponse: { id, name, description, price, available, imageUrl }
   */
  getAll: async (page = 0, size = 20) => {
    const res = await api.get('/products', { params: { page, size } })
    return res.data.data // { items, total, page, size }
  },
}

// ─── CART ────────────────────────────────────────────────────────────────────
export const cartApi = {
  /**
   * POST /api/carts
   * Body: { customerName, phone }
   * → { success, data: UUID string }
   */
  create: async (customerName, phone) => {
    const res = await api.post('/carts', { customerName, phone })
    return res.data.data // cartId UUID string
  },

  /**
   * POST /api/carts/{cartId}/items
   * Body: { productId, quantity }
   * → { success }
   */
  addItem: async (cartId, productId, quantity) => {
    const res = await api.post(`/carts/${cartId}/items`, { productId, quantity })
    return res.data
  },

  /**
   * GET /api/carts/{cartId}
   * → { success, data: { cartId, items: CartItemResponse[], totalAmount } }
   * CartItemResponse: { productId, productName, price, quantity, total }
   */
  get: async (cartId) => {
    const res = await api.get(`/carts/${cartId}`)
    return res.data.data // { cartId, items, totalAmount }
  },

  /**
   * DELETE /api/carts/{cartId}/items
   * → { success }
   */
  clear: async (cartId) => {
    const res = await api.delete(`/carts/${cartId}/items`)
    return res.data
  },
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export const orderApi = {
  /**
   * POST /api/orders/{cartId}
   * Body: { address, latitude?, longitude? }
   * → { success, data: { orderId, status, totalAmount, items: OrderItemResponse[] } }
   * OrderItemResponse: { productId, productName, price, quantity }
   */
  place: async (cartId, address, latitude = null, longitude = null) => {
    const body = { address }
    if (latitude !== null) body.latitude = latitude
    if (longitude !== null) body.longitude = longitude
    const res = await api.post(`/orders/${cartId}`, body)
    return res.data.data // { orderId, status, totalAmount, items }
  },
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
const ADMIN_PREFIX = '/admin'

export const adminApi = {
  /**
   * GET /api/admin/products?search=&page=0&size=10
   * → { success, data: { items: AdminProductResponse[], total, page, size } }
   * AdminProductResponse: { id, name, price, available, quantity, imageUrl }
   */
  getProducts: async (search = '', page = 0, size = 10) => {
    const res = await api.get(`${ADMIN_PREFIX}/products`, {
      params: { search: search || undefined, page, size },
    })
    return res.data.data // { items, total, page, size }
  },

  /**
   * POST /api/admin/products (multipart/form-data)
   * Parts: data (JSON CreateProductRequest), image (file, optional)
   * CreateProductRequest: { name, description, price }
   */
  createProduct: async (productData, imageFile) => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(productData)], { type: 'application/json' }))
    if (imageFile) form.append('image', imageFile)
    const res = await api.post(`${ADMIN_PREFIX}/products`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * PATCH /api/admin/products/{productId} (multipart/form-data)
   * Parts: data (JSON UpdateProductRequest), image (file, optional)
   * UpdateProductRequest: { name?, description?, price?, active? }
   */
  updateProduct: async (productId, productData, imageFile) => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify(productData)], { type: 'application/json' }))
    if (imageFile) form.append('image', imageFile)
    const res = await api.patch(`${ADMIN_PREFIX}/products/${productId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * DELETE /api/admin/products/{productId}
   */
  deleteProduct: async (productId) => {
    const res = await api.delete(`${ADMIN_PREFIX}/products/${productId}`)
    return res.data
  },

  /**
   * PATCH /api/admin/products/{productId}/inventory
   * Body: { quantity, isAvailable }
   */
  updateInventory: async (productId, quantity, isAvailable) => {
    const res = await api.patch(`${ADMIN_PREFIX}/products/${productId}/inventory`, {
      quantity,
      isAvailable,
    })
    return res.data
  },

  /**
   * GET /api/admin/orders?search=&page=0&size=10
   * → { success, data: Page<AdminOrderResponse> }
   * Spring Page: { content: AdminOrderResponse[], totalElements, number, size }
   * AdminOrderResponse: { orderId, customerName, phone, status, totalAmount, createdAt, items }
   */
  getOrders: async (search = '', page = 0, size = 10) => {
    const res = await api.get(`${ADMIN_PREFIX}/orders`, {
      params: { search: search || undefined, page, size },
    })
    // Note: admin getOrders returns Page<AdminOrderResponse> directly in data
    // Spring Page has: content[], totalElements, number, size
    return res.data.data // Spring Page object
  },

  /**
   * PATCH /api/admin/orders/{orderId}
   * Body: { status: OrderStatus }
   */
  updateOrderStatus: async (orderId, status) => {
    const res = await api.patch(`${ADMIN_PREFIX}/orders/${orderId}`, { status })
    return res.data
  },
}
