import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAdd }) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2">{product.title}</h3>
          <span className="text-blue-600 font-bold shrink-0">${product.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
          <span className="px-2 py-1 bg-gray-100 rounded-full">{product.sport}</span>
          {product.brand && <span className="px-2 py-1 bg-gray-100 rounded-full">{product.brand}</span>}
        </div>
        <button onClick={() => onAdd(product)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">Add to cart</button>
      </div>
    </div>
  )
}

function Cart({ items, onRemove, onCheckout }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  return (
    <div className="sticky top-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800">Your Cart</h3>
      <div className="mt-2 space-y-2 max-h-72 overflow-auto pr-1">
        {items.length === 0 && <p className="text-sm text-gray-500">Your cart is empty.</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-800">{it.title}</p>
              <p className="text-xs text-gray-500">Qty {it.qty} • ${it.price.toFixed(2)}</p>
            </div>
            <button onClick={() => onRemove(it.id)} className="text-xs text-red-600 hover:underline">Remove</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Subtotal</span>
        <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
      </div>
      <button disabled={items.length === 0} onClick={onCheckout} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium">Checkout</button>
    </div>
  )
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sport, setSport] = useState('')
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (category) params.append('category', category)
    if (sport) params.append('sport', sport)
    const res = await fetch(`${API_URL}/api/products?${params.toString()}`)
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products])
  const sports = useMemo(() => Array.from(new Set(products.map(p => p.sport))), [products])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, title: product.title, price: product.price, qty: 1 }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const checkout = async () => {
    const items = cart.map(c => ({ product_id: c.id, quantity: c.qty }))
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
    const shipping = subtotal > 100 ? 0 : 9.99
    const total = subtotal + shipping
    const payload = {
      items,
      customer: { name: 'Guest', email: 'guest@example.com', address: '123 Street', city: 'City', country: 'Country', postal_code: '00000' },
      subtotal, shipping, total
    }
    const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setCart([])
      setMessage('Order placed! We sent a confirmation email.')
    } else {
      const err = await res.json().catch(() => ({}))
      setMessage(`Checkout failed: ${err.detail || res.statusText}`)
    }
  }

  const seed = async () => {
    const res = await fetch(`${API_URL}/api/products/seed`, { method: 'POST' })
    if (res.ok) fetchProducts()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Niche Sportswear</h1>
          <div className="flex items-center gap-2">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products" className="px-3 py-2 border rounded-lg text-sm" />
            <button onClick={fetchProducts} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Search</button>
            <button onClick={seed} className="px-3 py-2 text-sm border rounded-lg">Seed demo</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Filter</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">All</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sport</label>
                <select value={sport} onChange={(e)=>setSport(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">All</option>
                  {sports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={fetchProducts} className="w-full bg-gray-800 hover:bg-black text-white rounded-lg py-2">Apply</button>
            </div>
          </div>
          <Cart items={cart} onRemove={removeFromCart} onCheckout={checkout} />
          {message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">{message}</p>}
        </aside>

        <section className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-white border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <p>© {new Date().getFullYear()} Niche Sportswear. All rights reserved.</p>
          <p>Built with love for runners, yogis, and trail adventurers.</p>
        </div>
      </footer>
    </div>
  )
}
