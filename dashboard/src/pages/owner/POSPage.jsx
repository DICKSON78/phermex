import { useState, useEffect, useRef, useCallback } from 'react'
import { toArray } from '../../utils/safeData';
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Clock,
  User,
  CheckCircle,
  Printer,
  Pause,
  AlertTriangle,
  ChevronDown,
  Barcode,
  Download,
} from 'lucide-react'
import { formatMoney } from '../../utils/currency'

const CATEGORIES = ['All', 'Tablets', 'Capsules', 'Bottles', 'Inhalers', 'Creams', 'Packets']

const CATEGORY_KEY = {
  All: 'common.all',
  Tablets: 'sales.pos.categories.tablets',
  Capsules: 'sales.pos.categories.capsules',
  Bottles: 'sales.pos.categories.bottles',
  Inhalers: 'sales.pos.categories.inhalers',
  Creams: 'sales.pos.categories.creams',
  Packets: 'sales.pos.categories.packets',
}

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', labelKey: 'sales.orders.methods.cash', icon: Banknote },
  { key: 'card', label: 'Card', labelKey: 'sales.orders.methods.card', icon: CreditCard },
  { key: 'mobile_money', label: 'Mobile Money', labelKey: 'sales.orders.methods.mobile_money', icon: Smartphone },
  { key: 'bank_transfer', label: 'Bank Transfer', labelKey: 'sales.orders.methods.bank_transfer', icon: Landmark },
]

const PAYMENT_KEY = {
  cash: 'sales.orders.methods.cash',
  card: 'sales.orders.methods.card',
  mobile_money: 'sales.orders.methods.mobile_money',
  bank_transfer: 'sales.orders.methods.bank_transfer',
}

const TAX_RATE = 0.18

function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2 })
}

function fmt(amount) {
  return Number(amount || 0).toFixed(2)
}

export default function POSPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [drugs, setDrugs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(TAX_RATE * 100)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [customer, setCustomer] = useState({ name: t('pos.walkIn'), id: null })
  const [showCustomerInput, setShowCustomerInput] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [saleComplete, setSaleComplete] = useState(null)
  const [receiptQr, setReceiptQr] = useState('')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [heldSales, setHeldSales] = useState([])

  const searchInputRef = useRef(null)

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await api.get('/drugs')
        const raw = toArray(res.data)
        const normalized = Array.isArray(raw) ? raw.map((d) => ({
          id: d.id,
          name: d.name,
          genericName: d.generic_name || '',
          price: Number(d.selling_price) || 0,
          buyingPrice: Number(d.buying_price) || 0,
          stock: Number(d.quantity) || 0,
          category: typeof d.category === 'object' ? d.category?.name : (d.category || 'Uncategorized'),
          barcode: d.barcode || '',
        })) : []
        setDrugs(normalized)
      } catch {
        setDrugs([])
      } finally {
        setLoading(false)
      }
    }
    fetchDrugs()
  }, [])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const match = drugs.find(
        (d) =>
          d.barcode?.toLowerCase() === searchQuery.trim().toLowerCase() ||
          d.name.toLowerCase() === searchQuery.trim().toLowerCase()
      )
      if (match) {
        addToCart(match)
        setSearchQuery('')
      }
    }
  }, [drugs, searchQuery])

  const filteredDrugs = drugs.filter((d) => {
    const matchesSearch =
      !searchQuery ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (drug) => {
    if (drug.stock <= 0) return
    setCart((prev) => {
      const existing = prev.find((item) => item.id === drug.id)
      if (existing) {
        if (existing.quantity >= drug.stock) return prev
        return prev.map((item) =>
          item.id === drug.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...drug, quantity: 1 }]
    })
  }

  const updateQuantity = (drugId, delta) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === drugId)
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter((i) => i.id !== drugId)
      if (newQty > item.stock) return prev
      return prev.map((i) => (i.id === drugId ? { ...i, quantity: newQty } : i))
    })
  }

  const removeFromCart = (drugId) => {
    setCart((prev) => prev.filter((i) => i.id !== drugId))
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = parseFloat(discount) || 0
  const afterDiscount = Math.max(0, cartSubtotal - discountAmount)
  const taxAmount = afterDiscount * (parseFloat(tax) / 100)
  const grandTotal = afterDiscount + taxAmount
  const tenderedAmount = parseFloat(amountTendered) || 0
  const changeDue = Math.max(0, tenderedAmount - grandTotal)

  // For cash sales, default the tendered amount to the exact total so the
  // Complete Sale button is immediately actionable (Change = 0).
  useEffect(() => {
    if (paymentMethod === 'cash' && amountTendered === '' && grandTotal > 0) {
      setAmountTendered(String(grandTotal.toFixed(2)))
    }
  }, [paymentMethod, grandTotal, amountTendered])

  useEffect(() => {
    if (!saleComplete) {
      setReceiptQr('')
      return
    }
    const payload = [
      `PHARMACY: ${saleComplete.pharmacy || ''}`,
      `ORDER: ${saleComplete.code || ''}`,
      `TOTAL: ${formatCurrency(saleComplete.total)}`,
      `DATE: ${saleComplete.date || ''}`,
    ].join('\n')
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 256 })
      .then(setReceiptQr)
      .catch(() => setReceiptQr(''))
  }, [saleComplete])

  const canCompleteSale =
    paymentMethod && cart.length > 0 && (paymentMethod !== 'cash' || tenderedAmount >= grandTotal)

  const completeSale = async () => {
    if (!canCompleteSale) return
    setProcessing(true)
    const paymentLabel = PAYMENT_METHODS.find((m) => m.key === paymentMethod)?.label || paymentMethod || 'Cash'
    const receiptBase = {
      subtotal: cartSubtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      items: cart.map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        line: item.price * item.quantity,
      })),
      payment: paymentLabel,
      paymentKey: paymentMethod,
      tendered: paymentMethod === 'cash' ? tenderedAmount : grandTotal,
      change: paymentMethod === 'cash' ? changeDue : 0,
      customer: customer?.name || t('pos.walkIn'),
      pharmacy: user?.current_pharmacy?.pharmacy_name || user?.currentPharmacy?.pharmacy_name || 'Helix Pharmacy',
      cashier: user?.name || t('pos.cashier'),
      date: new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
    try {
      const orderData = {
        items: cart.map((item) => ({
          drug_id: item.id,
          quantity: item.quantity,
        })),
        customer_id: customer.id,
        order_type: 'counter',
        payment_method: paymentMethod,
        discount: discountAmount,
        tax: taxAmount,
        payment_status: 'paid',
      }
      const res = await api.post('/orders', orderData)
      const orderCode = res.data?.order?.order_code || res.data?.order?.code || res.data?.code || `ORD-${Date.now().toString().slice(-4)}`
      setSaleComplete({ ...receiptBase, code: orderCode })
      resetCart()
    } catch {
      const orderCode = `ORD-${Date.now().toString().slice(-4)}`
      setSaleComplete({ ...receiptBase, code: orderCode })
      resetCart()
    } finally {
      setProcessing(false)
    }
  }

  const printReceipt = () => {
    const el = document.getElementById('pos-receipt')
    if (!el) return
    const win = window.open('', '_blank', 'width=420,height=640')
    if (!win) return
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${t('sales.pos.receiptTitle')} ${saleComplete?.code || ''}</title>
<style>
  @media print { @page { size: 80mm auto; margin: 4mm; } }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Courier New', monospace; }
</style></head><body>${el.outerHTML}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      setTimeout(() => win.close(), 200)
    }, 250)
  }

  const downloadPdf = () => {
    const receipt = saleComplete
    if (!receipt) return
    const items = receipt.items || []
    const pageH = Math.max(120, 46 + items.length * 7.5 + 104)
    const doc = new jsPDF({ unit: 'mm', format: [80, pageH] })
    const font = 'courier'
    const W = 80
    const L = 5
    const R = 75
    const CX = 40
    let y = 10

    const dashedLine = () => {
      doc.setDrawColor(120)
      doc.setLineWidth(0.3)
      doc.setLineDashPattern([1, 1], 0)
      doc.line(L, y, R, y)
      y += 3
    }

    doc.setFont(font, 'bold')
    doc.setFontSize(11)
    doc.text(receipt.pharmacy || 'Helix Pharmacy', CX, y, { align: 'center' })
    y += 5
    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    doc.text(receipt.date || '', CX, y, { align: 'center' })
    y += 3.5
    doc.setFont(font, 'bold')
    doc.text(t('pos.saleReceipt'), CX, y, { align: 'center' })
    y += 2.5
    dashedLine()
    doc.setFont(font, 'normal')
    doc.text(`${t('pos.receiptNo')}: ${receipt.code}`, L, y)
    y += 4
    doc.text(`${t('pos.cashier')}: ${receipt.cashier || '-'}`, L, y)
    y += 4
    doc.text(`${t('pos.customer')}: ${receipt.customer || t('pos.walkIn')}`, L, y)
    y += 3
    dashedLine()

    items.forEach((item) => {
      const name = (item.name || '').length > 30 ? (item.name || '').slice(0, 29) + '…' : (item.name || '')
      doc.text(name, L, y)
      doc.text(`${item.qty} x ${fmt(item.price)}`, R, y, { align: 'right' })
      y += 4
      doc.setLineDashPattern([0.5, 1], 0)
      doc.setDrawColor(180)
      doc.line(L, y - 1, R - 10, y - 1)
      doc.setFont(font, 'bold')
      doc.text(fmt(item.line), R, y, { align: 'right' })
      doc.setFont(font, 'normal')
      y += 5.5
    })
    doc.setDrawColor(120)
    doc.setFontSize(9)

    doc.setFont(font, 'normal')
    doc.text(t('pos.subtotal'), L, y)
    doc.text(fmt(receipt.subtotal), R, y, { align: 'right' })
    y += 5
    doc.text(t('sales.pos.discountShort'), L, y)
    doc.text(`-${fmt(receipt.discount)}`, R, y, { align: 'right' })
    y += 5
    doc.text(t('pos.vat'), L, y)
    doc.text(fmt(receipt.tax), R, y, { align: 'right' })
    y += 5
    doc.setFont(font, 'bold')
    doc.setDrawColor(0)
    doc.setLineWidth(0.4)
    doc.line(L, y, R, y)
    doc.setFontSize(11)
    doc.text(t('pos.total'), L, y + 4)
    doc.text(fmt(receipt.total), R, y + 4, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont(font, 'normal')
    y += 8
    doc.line(L, y, R, y)
    doc.setLineWidth(0.3)
    y += 5
    doc.text(`${t('sales.orders.payment')}: ${t(PAYMENT_KEY[receipt.paymentKey], receipt.payment || 'Cash')}`, L, y)
    if ((receipt.payment || '') === 'Cash') {
      y += 5
      doc.text(t('sales.pos.tendered'), L, y)
      doc.text(fmt(receipt.tendered), R, y, { align: 'right' })
      y += 5
      doc.text(t('pos.change'), L, y)
      doc.text(fmt(receipt.change), R, y, { align: 'right' })
      y += 3
    }

    if (receiptQr) {
      y += 3
      doc.addImage(receiptQr, 'PNG', CX - 14, y, 28, 28)
      y += 31
    }

    y += 2
    dashedLine()
    doc.setFont(font, 'bold')
    doc.setFontSize(8)
    doc.text(t('pos.thankYou'), CX, y, { align: 'center' })
    y += 3.5
    doc.setFont(font, 'normal')
    doc.text(t('pos.poweredBy'), CX, y, { align: 'center' })

    doc.save(`${receipt.code || 'receipt'}.pdf`)
  }

  const resetCart = () => {
    setCart([])
    setDiscount(0)
    setPaymentMethod('cash')
    setAmountTendered('')
    setCustomer({ name: t('pos.walkIn'), id: null })
    setMobileCartOpen(false)
  }

  const holdSale = () => {
    if (cart.length === 0) return
    setHeldSales((prev) => [
      ...prev,
      { cart: [...cart], discount, customer, timestamp: new Date().toLocaleTimeString() },
    ])
    resetCart()
  }

  const resumeSale = (index) => {
    const held = heldSales[index]
    setCart(held.cart)
    setDiscount(held.discount)
    setCustomer(held.customer)
    setHeldSales((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Drug Search & Selection */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 lg:p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t('sales.pos.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 lg:px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto hide-scrollbar">
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-dark'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t(CATEGORY_KEY[cat], cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Drug Grid */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredDrugs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('products.noDrugs')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDrugs.map((drug) => (
                  <button
                    key={drug.id}
                    onClick={() => addToCart(drug)}
                    disabled={drug.stock <= 0}
                    className={`text-left bg-white rounded-xl p-3 lg:p-4 border border-gray-100 transition-all ${
                      drug.stock <= 0
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:border-primary hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-dark truncate">{drug.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{drug.genericName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">{formatCurrency(drug.price)}</span>
                      <span
                        className={`text-xs font-medium ${
                          drug.stock <= 0 ? 'text-red-500' : drug.stock < 10 ? 'text-yellow-600' : 'text-gray-400'
                        }`}
                      >
                        {drug.stock <= 0 ? t('dashboard.outOfStock') : `${drug.stock} ${t('sales.pos.inStock')}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart (desktop) */}
        <div className="hidden lg:flex w-[400px] xl:w-[420px] flex-col bg-white border-l border-gray-200 flex-shrink-0">
          <CartPanel
            cart={cart}
            discount={discount}
            setDiscount={setDiscount}
            tax={tax}
            setTax={setTax}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountTendered={amountTendered}
            setAmountTendered={setAmountTendered}
            customer={customer}
            setCustomer={setCustomer}
            showCustomerInput={showCustomerInput}
            setShowCustomerInput={setShowCustomerInput}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            cartSubtotal={cartSubtotal}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            tenderedAmount={tenderedAmount}
            changeDue={changeDue}
            canCompleteSale={canCompleteSale}
            completeSale={completeSale}
            processing={processing}
            holdSale={holdSale}
            resetCart={resetCart}
          />
        </div>
      </div>

      {/* Held Sales Bar */}
      {heldSales.length > 0 && (
        <div className="flex-shrink-0 bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex items-center gap-3 overflow-x-auto hide-scrollbar">
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">{t('sales.pos.held')}</span>
          {heldSales.map((sale, idx) => (
            <button
              key={idx}
              onClick={() => resumeSale(idx)}
              className="flex items-center gap-2 bg-white border border-yellow-300 rounded-lg px-3 py-1.5 text-xs font-medium text-dark hover:bg-yellow-100 transition whitespace-nowrap"
            >
              <Pause className="w-3 h-3 text-yellow-600" />
              {sale.cart.length} {t('pos.items')} &middot; {sale.timestamp}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Cart FAB */}
      <div className="lg:hidden flex-shrink-0">
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-6 h-6 text-dark" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
            
          )}
        </button>
      </div>

      {/* Mobile Cart Drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50" style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-dark">{t('sales.pos.currentSale')}</h3>
              <button onClick={() => setMobileCartOpen(false)} className="text-gray-400 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel
                cart={cart}
                discount={discount}
                setDiscount={setDiscount}
                tax={tax}
                setTax={setTax}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                amountTendered={amountTendered}
                setAmountTendered={setAmountTendered}
                customer={customer}
                setCustomer={setCustomer}
                showCustomerInput={showCustomerInput}
                setShowCustomerInput={setShowCustomerInput}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                cartSubtotal={cartSubtotal}
                discountAmount={discountAmount}
                taxAmount={taxAmount}
                grandTotal={grandTotal}
                tenderedAmount={tenderedAmount}
                changeDue={changeDue}
                canCompleteSale={canCompleteSale}
                completeSale={completeSale}
                processing={processing}
                holdSale={holdSale}
                resetCart={resetCart}
                isMobile
                onClose={() => setMobileCartOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sale Complete Modal */}
      {saleComplete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setSaleComplete(null); if (searchInputRef.current) searchInputRef.current.focus() }} />
          <div className="relative bg-white rounded-2xl p-5 w-[92%] max-w-[340px] animate-fadeIn z-10 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-dark leading-tight">{t('pos.saleComplete')}</h2>
                  <p className="text-[11px] text-gray-400">{t('pos.transactionSuccess')}</p>
                </div>
              </div>
              <button
                onClick={() => { setSaleComplete(null); if (searchInputRef.current) searchInputRef.current.focus() }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div
              id="pos-receipt"
              className="bg-white rounded-lg border border-gray-100 px-4 py-4 mb-4"
              style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: '#222' }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1.5, margin: 0 }}>{saleComplete.pharmacy || 'Helix Pharmacy'}</p>
                <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0' }}>{saleComplete.date || ''}</p>
              </div>
              <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', marginBottom: 8, fontSize: 11, color: '#444' }}>
                <p style={{ margin: 0 }}>{t('pos.receiptNo')}: <strong>{saleComplete.code}</strong></p>
                <p style={{ margin: '2px 0 0' }}>{t('pos.cashier')}: {saleComplete.cashier || '—'}</p>
                <p style={{ margin: '2px 0 0' }}>{t('pos.customer')}: {saleComplete.customer || t('pos.walkIn')}</p>
              </div>

              {/* Items */}
              {(saleComplete.items || []).map((item, index) => (
                <div key={index} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 11, color: '#333' }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{item.qty} x {fmt(item.price)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#000' }}>
                    <span style={{ flex: 1, borderBottom: '1px dotted #ccc', minWidth: 12 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>{fmt(item.line)}</span>
                  </div>
                </div>
              ))}
              {(saleComplete.items || []).length === 0 && (
                <p style={{ fontSize: 11, color: '#888', margin: '4px 0' }}>{t('sales.pos.noItems')}</p>
              )}

              {/* Totals */}
              <div style={{ borderTop: '1px dashed #999', paddingTop: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>{t('pos.subtotal')}</span><span>{fmt(saleComplete.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>{t('sales.pos.discountShort')}</span><span>-{fmt(saleComplete.discount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>{t('pos.vat')}</span><span>{fmt(saleComplete.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#000', padding: '6px 0', borderTop: '1px solid #999', borderBottom: '1px solid #999', marginTop: 4 }}>
                  <span>{t('pos.total')}</span><span>{fmt(saleComplete.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', marginTop: 6 }}>
                  <span>{t('sales.orders.payment')}: {t(PAYMENT_KEY[saleComplete.paymentKey], saleComplete.payment || 'Cash')}</span>
                </div>
                {saleComplete.payment === 'Cash' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>{t('sales.pos.tendered')}</span><span>{fmt(saleComplete.tendered)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>{t('pos.change')}</span><span>{fmt(saleComplete.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* QR Code */}
              {receiptQr && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <img src={receiptQr} alt="QR Code" style={{ width: 94, height: 94, display: 'block' }} />
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: '#888' }}>{t('pos.scanToVerify')}</p>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#444' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{t('pos.thankYou')}</p>
                <p style={{ margin: '2px 0 0' }}>{t('pos.poweredBy')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { downloadPdf(); setSaleComplete(null); if (searchInputRef.current) searchInputRef.current.focus() }}
                className="py-2.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {t('sales.pos.downloadPdf')}
              </button>
              <button
                onClick={() => { printReceipt(); setSaleComplete(null); if (searchInputRef.current) searchInputRef.current.focus() }}
                className="py-2.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-[#0bc246] transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {t('pos.printReceipt')}
              </button>
            </div>
            <button
              onClick={() => { setSaleComplete(null); if (searchInputRef.current) searchInputRef.current.focus() }}
              className="w-full mt-2 py-2.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              {t('pos.newSale')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CartPanel({
  cart,
  discount,
  setDiscount,
  tax,
  setTax,
  paymentMethod,
  setPaymentMethod,
  amountTendered,
  setAmountTendered,
  customer,
  setCustomer,
  showCustomerInput,
  setShowCustomerInput,
  customerSearch,
  setCustomerSearch,
  updateQuantity,
  removeFromCart,
  cartSubtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  tenderedAmount,
  changeDue,
  canCompleteSale,
  completeSale,
  processing,
  holdSale,
  resetCart,
  isMobile,
  onClose,
}) {
  const { t } = useLanguage()
  return (
    <div className={`flex flex-col h-full ${isMobile ? '' : ''}`}>
      {/* Cart Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-dark text-sm">{t('sales.pos.currentSale')}</h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
          
        </div>
        {!isMobile && (
          <button onClick={resetCart} className="text-xs text-gray-400 hover:text-red-500 transition">
            {t('sales.pos.clearAll')}
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <ShoppingCart className="w-10 h-10 mb-2" />
            <p className="text-sm">{t('pos.emptyCart')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-2.5 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)} {t('sales.shared.each')}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-dark">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1">
                  <span className="text-sm font-semibold text-dark">{formatCurrency(item.price * item.quantity)}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary & Payment */}
      {cart.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 flex-shrink-0">
          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('sales.pos.discountTzs')}</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm text-dark outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('sales.pos.taxPercent')}</label>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm text-dark outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>{t('pos.subtotal')}</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>{t('sales.pos.discountShort')}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>{t('sales.pos.tax')} ({tax}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-dark pt-1 border-t border-gray-100">
              <span>{t('common.total')}</span>
              <span className="text-primary text-lg">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Customer */}
          <div>
            {showCustomerInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('sales.pos.customerSearch')}
                  className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-primary transition"
                />
                <button
                  onClick={() => {
                    setCustomer({ name: customerSearch || t('pos.walkIn'), id: null })
                    setShowCustomerInput(false)
                    setCustomerSearch('')
                  }}
                  className="text-xs text-primary font-medium"
                >
                  {t('sales.pos.set')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerInput(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-dark transition w-full"
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{customer.name}</span>
                <ChevronDown className="w-3 h-3 ml-auto" />
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon
              return (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-all ${
                    paymentMethod === pm.key
                      ? 'bg-primary text-dark'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(pm.labelKey)}
                </button>
              )
            })}
          </div>

          {/* Amount Tendered (Cash only) */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">{t('pos.amountTendered')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
                className="w-full mt-0.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm text-dark outline-none focus:border-primary transition"
              />
              {tenderedAmount > 0 && (
                <p className={`text-xs mt-1 font-medium ${tenderedAmount >= grandTotal ? 'text-primary' : 'text-red-500'}`}>
                  {tenderedAmount >= grandTotal
                    ? `${t('pos.change')}: ${formatCurrency(changeDue)}`
                    : `${t('sales.pos.insufficient')}: ${formatCurrency(grandTotal - tenderedAmount)} ${t('sales.pos.moreNeeded')}`}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={holdSale}
              className="py-2.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-200 transition flex items-center justify-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              {t('sales.pos.hold')}
            </button>
            <button
              onClick={resetCart}
              className="py-2.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition"
            >
              {t('common.clear')}
            </button>
          </div>
          <button
            onClick={completeSale}
            disabled={!canCompleteSale || processing}
            className="w-full py-3 bg-primary text-dark rounded-lg text-sm font-bold hover:bg-[#0bc246] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <span className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('pos.completeSale')} &mdash; {formatCurrency(grandTotal)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
