'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Loader2,
  Package,
  FileText,
  DollarSign,
  Download,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Send,
  Eye,
  ExternalLink,
  BookOpen,
  Music,
  Video,
  Ticket,
  Layers,
  ArrowUpDown,
  Tag,
  ImageIcon,
  Upload,
} from 'lucide-react'
import { uploadService } from '@/lib/upload'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'

export interface ChurchProduct {
  id: string
  name: string
  description?: string
  category: 'books' | 'ebooks' | 'sermons' | 'courses' | 'tickets' | 'merchandise' | 'materials' | 'other'
  productType: 'digital' | 'physical'
  isFree: boolean
  priceNgn: number
  priceUsd: number
  imageUrl?: string
  downloadUrl?: string
  stockQuantity?: number
  isUnlimitedStock: boolean
  status: 'active' | 'draft' | 'archived'
  isFeatured: boolean
  sku?: string
  paymentInstructions?: string
  createdAt?: any
}

export interface StoreOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  productName: string
  productId: string
  amount: number
  currency: 'NGN' | 'USD'
  paymentMethod: 'bank_transfer' | 'paystack' | 'flutterwave' | 'free' | 'manual'
  paymentStatus: 'pending' | 'paid' | 'failed'
  orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt?: any
}

export default function ChurchStorePage() {
  const { church } = useChurchStore()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [products, setProducts] = useState<ChurchProduct[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ChurchProduct | null>(null)
  const [submittingProduct, setSubmittingProduct] = useState(false)

  // AI Promotion Modal State
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoProduct, setPromoProduct] = useState<ChurchProduct | null>(null)
  const [promoChannel, setPromoChannel] = useState<'whatsapp' | 'email' | 'announcement'>('whatsapp')
  const [generatedPromo, setGeneratedPromo] = useState('')
  const [generatingPromo, setGeneratingPromo] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<ChurchProduct['category']>('books')
  const [formProductType, setFormProductType] = useState<'digital' | 'physical'>('digital')
  const [formIsFree, setFormIsFree] = useState(false)
  const [formPriceNgn, setFormPriceNgn] = useState<number>(3000)
  const [formPriceUsd, setFormPriceUsd] = useState<number>(5)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formDownloadUrl, setFormDownloadUrl] = useState('')
  const [formStock, setFormStock] = useState<number>(100)
  const [formUnlimitedStock, setFormUnlimitedStock] = useState(true)
  const [formStatus, setFormStatus] = useState<'active' | 'draft'>('active')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formSku, setFormSku] = useState('')
  const [formPaymentInstructions, setFormPaymentInstructions] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !church?.id) return

    setUploadingCover(true)
    try {
      const folder = uploadService.getChurchFolder(church.id, 'store')
      const res = await uploadService.upload(file, {
        folder,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxBytes: 5 * 1024 * 1024,
      })
      setFormImageUrl(res.url)
      toast.success('Cover image uploaded successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload cover image.')
    } finally {
      setUploadingCover(false)
    }
  }

  useEffect(() => {
    if (!church?.id) return
    loadProducts()
    loadOrders()
  }, [church?.id])

  async function loadProducts() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'products'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: ChurchProduct[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ChurchProduct)
        })
      }
      setProducts(list)
    } catch (err) {
      console.warn('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders() {
    if (!church?.id) return
    try {
      const q = query(
        collection(db, 'churches', church.id, 'orders'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: StoreOrder[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as StoreOrder)
        })
      }
      setOrders(list)
    } catch (err) {
      console.warn('Error loading orders:', err)
    }
  }

  const openAddProductModal = () => {
    setEditingProduct(null)
    setFormName('')
    setFormDescription('')
    setFormCategory('books')
    setFormProductType('digital')
    setFormIsFree(false)
    setFormPriceNgn(3000)
    setFormPriceUsd(5)
    setFormImageUrl('')
    setFormDownloadUrl('')
    setFormStock(100)
    setFormUnlimitedStock(true)
    setFormStatus('active')
    setFormFeatured(false)
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`)
    setFormPaymentInstructions(church?.giving?.givingInstructions ?? '')
    setShowProductModal(true)
  }

  const openEditProductModal = (prod: ChurchProduct) => {
    setEditingProduct(prod)
    setFormName(prod.name)
    setFormDescription(prod.description ?? '')
    setFormCategory(prod.category)
    setFormProductType(prod.productType)
    setFormIsFree(prod.isFree)
    setFormPriceNgn(prod.priceNgn ?? 0)
    setFormPriceUsd(prod.priceUsd ?? 0)
    setFormImageUrl(prod.imageUrl ?? '')
    setFormDownloadUrl(prod.downloadUrl ?? '')
    setFormStock(prod.stockQuantity ?? 100)
    setFormUnlimitedStock(prod.isUnlimitedStock ?? true)
    setFormStatus(prod.status === 'archived' ? 'draft' : prod.status)
    setFormFeatured(prod.isFeatured ?? false)
    setFormSku(prod.sku ?? '')
    setFormPaymentInstructions(prod.paymentInstructions ?? '')
    setShowProductModal(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !formName.trim()) return
    setSubmittingProduct(true)

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        productType: formProductType,
        isFree: formIsFree,
        priceNgn: formIsFree ? 0 : formPriceNgn,
        priceUsd: formIsFree ? 0 : formPriceUsd,
        imageUrl: formImageUrl.trim(),
        downloadUrl: formDownloadUrl.trim(),
        stockQuantity: formUnlimitedStock ? null : formStock,
        isUnlimitedStock: formUnlimitedStock,
        status: formStatus,
        isFeatured: formFeatured,
        sku: formSku.trim(),
        paymentInstructions: formPaymentInstructions.trim(),
        updatedAt: serverTimestamp(),
      }

      if (editingProduct) {
        await updateDoc(doc(db, 'churches', church.id, 'products', editingProduct.id), payload)
        toast.success('Product updated successfully!')
      } else {
        await addDoc(collection(db, 'churches', church.id, 'products'), {
          ...payload,
          churchId: church.id,
          createdAt: serverTimestamp(),
        })
        toast.success('Product created in Church Store!')
      }

      setShowProductModal(false)
      loadProducts()
    } catch {
      toast.error('Failed to save product.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!church?.id || !confirm('Are you sure you want to delete this resource?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'products', id))
      toast.success('Product removed from store.')
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  const handleOpenPromoModal = (prod: ChurchProduct) => {
    setPromoProduct(prod)
    setGeneratedPromo('')
    setShowPromoModal(true)
  }

  const handleGenerateAIPromotion = async () => {
    if (!promoProduct || !church?.id) return
    setGeneratingPromo(true)
    try {
      const prompt = `Resource Name: "${promoProduct.name}". Category: ${promoProduct.category}. Type: ${
        promoProduct.isFree ? 'Free Download' : `₦${promoProduct.priceNgn.toLocaleString()} / $${promoProduct.priceUsd}`
      }. Description: "${promoProduct.description ?? 'A powerful spiritual resource for the body of Christ'}". Channel: ${promoChannel.toUpperCase()}.`

      const idToken = await getIdToken()
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          contentType: 'store_promotion',
          churchId: church.id,
          churchName: church.name,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setGeneratedPromo(data.result)
        toast.success('✨ AI Promotional copy generated!')
      } else {
        toast.error(data.error ?? 'AI generation failed.')
      }
    } catch {
      toast.error('Could not generate promotion.')
    } finally {
      setGeneratingPromo(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: StoreOrder['orderStatus']) => {
    if (!church?.id) return
    try {
      await updateDoc(doc(db, 'churches', church.id, 'orders', orderId), {
        orderStatus: status,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Order status updated to ${status}.`)
      loadOrders()
    } catch {
      toast.error('Failed to update order status.')
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 text-xs">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-brand-600" />
            Church Store &amp; Ministry Resources
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish, manage, and promote books, e-books, sermons, courses, conference tickets, and study materials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddProductModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Product Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Orders &amp; Sales ({orders.length})
        </button>
      </div>

      {/* ── TAB 1: PRODUCT CATALOG ── */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-background px-3 py-1.5 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title, SKU, or keyword..."
                className="w-full bg-transparent focus:outline-none text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-9 rounded-xl border border-input bg-background px-3 font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="books">Physical Books</option>
                <option value="ebooks">E-Books (PDF/EPUB)</option>
                <option value="sermons">Audio/Video Sermons</option>
                <option value="courses">Ministry Courses</option>
                <option value="tickets">Conference Tickets</option>
                <option value="materials">Study Materials</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>
          </div>

          {/* Grid / Table */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">No Products in Church Store</h3>
              <p className="text-muted-foreground max-w-sm">
                {search || categoryFilter !== 'all'
                  ? 'No products matched your search filters.'
                  : 'Add ministry books, sermon recordings, devotionals, and tickets to make them available for your congregation.'}
              </p>
              <button
                type="button"
                onClick={openAddProductModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-600 uppercase">
                        {product.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          product.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    {product.imageUrl && (
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-muted/20 border">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <h3 className="font-display text-sm font-bold text-foreground line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-[11px]">
                      {product.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div>
                        {product.isFree ? (
                          <span className="font-bold text-emerald-600">FREE</span>
                        ) : (
                          <span className="font-bold text-foreground font-mono">
                            ₦{Number(product.priceNgn || 0).toLocaleString()}{' '}
                            <span className="text-muted-foreground font-normal text-[10px]">
                              (${product.priceUsd})
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {product.productType === 'digital' ? '⚡ Digital' : '📦 Physical'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPromoModal(product)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      AI Promo
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditProductModal(product)}
                        className="rounded-lg border p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg border p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: STORE ORDERS ── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
              <Package className="h-10 w-10 text-muted-foreground" />
              <h3 className="font-display text-base font-bold text-foreground">No Orders Recorded</h3>
              <p className="text-muted-foreground max-w-sm">
                Incoming member product orders and registrations will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Resource</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Order Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20">
                        <td className="p-3.5">
                          <p className="font-bold text-foreground">{order.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">{order.customerEmail}</p>
                        </td>
                        <td className="p-3.5 font-medium text-foreground">{order.productName}</td>
                        <td className="p-3.5 font-mono font-bold">
                          {order.amount === 0 ? 'FREE' : `₦${order.amount.toLocaleString()}`}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                            className="rounded-lg border bg-background px-2 py-1 font-semibold text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <span className="text-[10px] text-muted-foreground">{order.paymentMethod}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: ADD / EDIT PRODUCT ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">
                {editingProduct ? 'Edit Ministry Resource' : 'Add Ministry Resource'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Power of Kingdom Prayer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                  >
                    <option value="books">Physical Book</option>
                    <option value="ebooks">E-Book (PDF/EPUB)</option>
                    <option value="sermons">Audio/Video Sermon</option>
                    <option value="courses">Ministry Course</option>
                    <option value="tickets">Conference Ticket</option>
                    <option value="materials">Study Material</option>
                    <option value="merchandise">Merchandise</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Format</label>
                  <select
                    value={formProductType}
                    onChange={(e) => setFormProductType(e.target.value as any)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                  >
                    <option value="digital">Digital (Download / Stream)</option>
                    <option value="physical">Physical (In-Person / Delivery)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of this spiritual resource..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>

              {/* Pricing */}
              <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Pricing &amp; Access</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFree}
                      onChange={(e) => setFormIsFree(e.target.checked)}
                      className="rounded"
                    />
                    <span className="font-semibold text-emerald-600">Free Resource</span>
                  </label>
                </div>

                {!formIsFree && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="font-medium text-muted-foreground">Price (NGN ₦)</label>
                      <input
                        type="number"
                        value={formPriceNgn}
                        onChange={(e) => setFormPriceNgn(Number(e.target.value) || 0)}
                        className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Price (USD $)</label>
                      <input
                        type="number"
                        value={formPriceUsd}
                        onChange={(e) => setFormPriceUsd(Number(e.target.value) || 0)}
                        className="mt-1 flex h-8 w-full rounded-lg border bg-background px-2 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Digital URL */}
              {formProductType === 'digital' && (
                <div>
                  <label className="font-semibold text-foreground">Download / Access URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or media link"
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Cover Image Media Picker */}
              <div>
                <label className="font-semibold text-foreground">Cover Image (Media Picker)</label>
                {formImageUrl ? (
                  <div className="mt-1.5 flex items-center gap-3 rounded-xl border bg-muted/20 p-2.5">
                    <img
                      src={formImageUrl}
                      alt="Cover preview"
                      className="h-14 w-14 rounded-lg object-cover border bg-background"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate text-[11px]">Cover Media Active</p>
                      <p className="font-mono text-[9px] text-muted-foreground truncate">{formImageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="rounded-lg border bg-card p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 px-3.5 font-semibold text-brand-600 hover:bg-brand-500/10 transition-colors">
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>{uploadingCover ? 'Uploading...' : 'Select Media Image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingCover}
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">SKU / Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Save Resource
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 2: AI PROMOTION ENGINE ── */}
      {showPromoModal && promoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="font-display text-sm font-bold text-foreground">
                  AI Promotional Copy Generator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Generate compelling spiritual promotional copy for <strong>{promoProduct.name}</strong>.
              </p>

              <div>
                <label className="font-semibold text-foreground">Target Broadcast Channel</label>
                <select
                  value={promoChannel}
                  onChange={(e) => setPromoChannel(e.target.value as any)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                >
                  <option value="whatsapp">WhatsApp Broadcast (Emoji formatted)</option>
                  <option value="email">Email Newsletter Section</option>
                  <option value="announcement">Sunday Service Announcement Script</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAIPromotion}
                disabled={generatingPromo}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
              >
                {generatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-300" />
                )}
                Generate Promotional Copy with AgentRouter
              </button>

              {generatedPromo && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground">Generated Draft</label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPromo)
                        toast.success('Copied to clipboard!')
                      }}
                      className="text-[10px] font-bold text-brand-600 hover:underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={generatedPromo}
                    onChange={(e) => setGeneratedPromo(e.target.value)}
                    className="flex w-full rounded-xl border bg-muted/20 p-3 font-sans text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    ℹ️ You can copy and paste this into your Communications broadcasts or edit as desired.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
