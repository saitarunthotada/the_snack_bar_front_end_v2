import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartApi } from '../services/api'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(() => localStorage.getItem('cart_id') || null)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async (id) => {
    if (!id) return
    try {
      const data = await cartApi.get(id)
      setCart(data)
    } catch {
      // cart may be expired after order placed
    }
  }, [])

  useEffect(() => {
    if (cartId) fetchCart(cartId)
  }, [cartId, fetchCart])

  const createCart = async (customerName, phone) => {
    const id = await cartApi.create(customerName, phone)
    localStorage.setItem('cart_id', id)
    setCartId(id)
    setCart({ cartId: id, items: [], totalAmount: 0 })
    return id
  }

  const addToCart = async (productId, quantity = 1) => {
    if (!cartId) return false
    setLoading(true)
    try {
      const currentItem = cart?.items?.find(i => i.productId === productId)
      const currentQty = currentItem?.quantity || 0
      const newQty = currentQty + quantity

      if (newQty <= 0) {
        // need to remove this item — backend has no per-item delete
        // so: clear cart, then re-add every other item
        const otherItems = (cart?.items || []).filter(i => i.productId !== productId)

        await cartApi.clear(cartId)

        if (otherItems.length === 0) {
          // cart is now empty, just update local state
          setCart(prev => prev ? { ...prev, items: [], totalAmount: 0 } : null)
        } else {
          // re-add all remaining items one by one
          for (const item of otherItems) {
            await cartApi.addItem(cartId, item.productId, item.quantity)
          }
          await fetchCart(cartId)
        }
      } else {
        await cartApi.addItem(cartId, productId, quantity)
        await fetchCart(cartId)
      }

      return true
    } catch (err) {
      toast.error(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!cartId) return
    await cartApi.clear(cartId)
    setCart(prev => prev ? { ...prev, items: [], totalAmount: 0 } : null)
  }

  const resetCart = () => {
    localStorage.removeItem('cart_id')
    setCartId(null)
    setCart(null)
  }

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{
      cartId, cart, loading, itemCount,
      createCart, addToCart, clearCart, resetCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)