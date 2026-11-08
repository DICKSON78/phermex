import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Star,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  X,
  ArrowRight,
  Boxes,
  Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import { currentBase } from '../../utils/roles'
import { useAuth } from '../../contexts/AuthContext'

const SHIPMENT_OPTIONS = [
  { value: 'pickup', label: 'Pickup from supplier', hint: 'No delivery fee. You collect the order.' },
  { value: 'standard', label: 'Standard delivery', hint: 'Delivered to the pharmacy address.' },
  { value: 'express', label: 'Express delivery', hint: 'Priority delivery, usually next day.' },
]

const TYPE_STYLES = {
  wholesaler: 'bg-[#0FD452]/10 text-[#0a8f3c]',
  distributor: 'bg-blue-100 text-blue-700',
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WholesaleCatalogPage() {
  const { wholesalerId } = useParams()
  const navigate = useNavigate()
  const base = currentBase()
  const { user, pharmacyId } = useAuth()

  const [wholesaler, setWholesaler] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const [cart, setCart] = useState({})
  const [shipmentMethod, setShipmentMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [accountNumber, setAccountNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)

  const pharmacies = user?.accessible_pharmacies?.length ? user.accessible_pharmacies : user?.pharmacy || []
  const currentPharmacy = user?.current_pharmacy ?? pharmacies.find((p) => p.id === pharmacyId) ?? pharmacies[0]
  const activePharmacyId = pharmacyId || currentPharmacy?.id

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/wholesale-marketplace/wholesalers/${wholesalerId}/catalog`)
        setWholesaler(res.data?.wholesaler || null)
        setItems(Array.isArray(res.data?.items) ? res.data.items : [])
        setDeliveryAddress(
          [
            currentPharmacy?.street || currentPharmacy?.address,
            currentPharmacy?.ward,
            currentPharmacy?.district,
            currentPharmacy?.region,
          ]
            .filter(Boolean)
            .join(', ')
        )
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Could not load this supplier catalog.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [wholesalerId])

  useEffect(() => {
    if (wholesaler && !wholesaler.accepts_credit) setPaymentMethod('cash')
  }, [wholesaler])

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  )

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = items.filter((item) => {
      if (category && item.category !== category) return false
      if (!q) return true
      return [item.drug_name, item.unit, item.category, item.batch_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    const map = new Map()
    filtered.forEach((item) => {
      if (!map.has(item.drug_name)) map.set(item.drug_name, [])
      map.get(item.drug_name).push(item)
    })

    return [...map.entries()]
      .map(([name, variants]) => ({
        name,
        category: variants[0]?.category,
        variants: variants.sort((a, b) => a.pack_size - b.pack_size),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items, search, category])

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = items.find((entry) => String(entry.id) === String(id))
          if (!item || quantity <= 0) return null
          return { ...item, quantity, lineTotal: Number(item.unit_price) * quantity }
        })
        .filter(Boolean),
    [cart, items]
  )

  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0)
  const shipmentFee = !wholesaler
    ? 0
    : shipmentMethod === 'pickup'
      ? 0
      : shipmentMethod === 'express'
        ? Number(wholesaler.express_delivery_fee || wholesaler.delivery_fee || 0)
        : Number(wholesaler.delivery_fee || 0)
  const total = subtotal + shipmentFee
  const minimumOrder = Number(wholesaler?.minimum_order_amount || 0)
  const belowMinimum = cartLines.length > 0 && minimumOrder > 0 && subtotal < minimumOrder

  const add = (item) => {
    setCart((prev) => ({ ...prev, [item.id]: Math.min(Number(item.quantity_in_stock || 0), (prev[item.id] || 0) + 1) }))
  }

  const setQuantity = (item, value) => {
    const next = Math.max(0, Math.min(Number(item.quantity_in_stock || 0), Number(value) || 0))
    setCart((prev) => {
      const updated = { ...prev }
      if (next === 0) delete updated[item.id]
      else updated[item.id] = next
      return updated
    })
  }

  const removeLine = (id) => {
    setCart((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const placeOrder = async () => {
    setOrderError('')

    if (!activePharmacyId) {
      setOrderError('Select a pharmacy before placing a wholesale order.')
      return
    }
    if (cartLines.length === 0) {
      setOrderError('Add at least one medicine to the cart.')
      return
    }
    if (belowMinimum) {
      setOrderError(`The minimum order for ${wholesaler.name} is ${formatMoney(minimumOrder)}. Add ${formatMoney(minimumOrder - subtotal)} more.`)
      return
    }
    if (shipmentMethod !== 'pickup' && !deliveryAddress.trim()) {
      setOrderError('Enter the delivery address for this order.')
      return
    }
    if (paymentMethod === 'credit' && !accountNumber.trim()) {
      setOrderError('Enter your credit account number so the supplier can confirm and prepare the order.')
      return
    }

    setPlacing(true)
    try {
      const res = await api.post('/wholesale-marketplace/orders', {
        pharmacy_id: activePharmacyId,
        wholesaler_id: wholesaler.id,
        items: cartLines.map((line) => ({ inventory_id: line.id, quantity: line.quantity, unit: line.unit })),
        shipment_method: shipmentMethod,
        delivery_address: shipmentMethod === 'pickup' ? '' : deliveryAddress.trim(),
        payment_method: paymentMethod,
        account_number: paymentMethod === 'credit' ? accountNumber.trim() : null,
        expected_delivery_date: expectedDate || null,
        notes: notes.trim() || null,
      })

      setPlacedOrder(res.data?.order || null)
      setCart({})
      toast.success('Wholesale order placed')
      setShipmentMethod('standard')
      setPaymentMethod('cash')
      setAccountNumber('')
      setNotes('')
    } catch (error) {
      const errors = error.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setOrderError(first || error.response?.data?.message || 'Could not place the order.')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl bg-white lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-5">
        <Link to={`${base}/wholesale-marketplace`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Store className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#000F14]">Catalog unavailable</h3>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to={`${base}/wholesale-marketplace`} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0FD452]/10">
            <Truck className="h-5 w-5 text-[#0FD452]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{wholesaler?.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[wholesaler?.business_type] || TYPE_STYLES.wholesaler}`}>
                {wholesaler?.business_type}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[wholesaler?.city, wholesaler?.region].filter(Boolean).join(', ')}</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {Number(wholesaler?.rating || 0).toFixed(1)}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {wholesaler?.phone}</span>
              <span className="flex items-center gap-1"><Boxes className="h-3 w-3" /> Min order {formatMoney(minimumOrder)}</span>
              <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery {formatMoney(wholesaler?.delivery_fee || 0)}</span>
            </div>
          </div>
        </div>
        <Link to={`${base}/wholesale-orders`} className="btn-secondary">
          <FileText className="h-4 w-4" />
          My orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicine or unit..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#000F14] outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#000F14] outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
              >
                <option value="">All categories</option>
                {categories.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
              <Package className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-[#000F14]">No medicines match your search</h3>
              <p className="text-sm text-gray-500">Try another name, category or unit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.name} className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#000F14]">{group.name}</h3>
                      <p className="text-xs text-gray-500">{group.category || 'General'}</p>
                    </div>
                    <span className="text-[11px] text-gray-400">{group.variants.length} units</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {group.variants.map((item) => {
                      const quantity = cart[item.id] || 0
                      const outOfStock = Number(item.quantity_in_stock) <= 0

                      return (
                        <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0FD452]/10">
                            <PillIcon item={item} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#000F14]">{item.unit}</p>
                            <p className="text-[11px] text-gray-400">
                              {item.pack_size > 1 ? `${item.pack_size} pieces per ${item.unit}` : 'Single piece'}
                              {item.expiry_date ? ` · expires ${formatDate(item.expiry_date)}` : ''}
                            </p>
                          </div>
                          <div className="w-24 text-right">
                            <p className="text-sm font-semibold text-[#000F14]">{formatMoney(item.unit_price)}</p>
                            <p className={`text-[11px] ${outOfStock ? 'text-red-500' : item.quantity_in_stock <= 10 ? 'text-yellow-600' : 'text-gray-400'}`}>
                              {outOfStock ? 'Out of stock' : `${item.quantity_in_stock} in stock`}
                            </p>
                          </div>
                          <div className="w-32">
                            {outOfStock ? (
                              <span className="block text-center text-xs text-gray-400">Unavailable</span>
                            ) : quantity > 0 ? (
                              <div className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                                <button onClick={() => setQuantity(item, quantity - 1)} className="rounded p-1 text-gray-600 hover:bg-white" title="Decrease">
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  value={quantity}
                                  onChange={(event) => setQuantity(item, event.target.value)}
                                  className="w-10 bg-transparent text-center text-sm font-semibold text-[#000F14] outline-none"
                                />
                                <button onClick={() => setQuantity(item, quantity + 1)} className="rounded p-1 text-gray-600 hover:bg-white" title="Increase">
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => add(item)} className="btn-primary w-full justify-center !px-3 !py-2 text-xs">
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#000F14]">
                  <ShoppingCart className="h-4 w-4 text-[#0FD452]" />
                  Order cart
                </h2>
                {cartLines.length > 0 && (
                  <button onClick={() => setCart({})} className="text-xs font-medium text-gray-500 hover:text-red-600">
                    Clear
                  </button>
                )}
              </div>

              {cartLines.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center">
                  <ShoppingCart className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                  <p className="text-sm text-gray-500">Your cart is empty</p>
                  <p className="text-xs text-gray-400">Add medicines from the catalog.</p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {cartLines.map((line) => (
                    <div key={line.id} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#000F14]">{line.drug_name}</p>
                        <p className="text-[11px] text-gray-500">
                          {line.unit} · {line.quantity} × {formatMoney(line.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#000F14]">{formatMoney(line.lineTotal)}</p>
                        <button onClick={() => removeLine(line.id)} className="text-[11px] text-red-500 hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{formatMoney(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipment</span><span className="font-medium">{shipmentFee === 0 ? 'Free' : formatMoney(shipmentFee)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-[#000F14]"><span>Total</span><span>{formatMoney(total)}</span></div>
              </div>

              {belowMinimum && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Minimum order is {formatMoney(minimumOrder)}. Add {formatMoney(minimumOrder - subtotal)} more to continue.
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#000F14]">
                <Truck className="h-4 w-4 text-[#0FD452]" />
                Shipment method
              </h3>
              <div className="mt-3 space-y-2">
                {SHIPMENT_OPTIONS.map((option) => {
                  const fee =
                    option.value === 'pickup'
                      ? 0
                      : option.value === 'express'
                        ? Number(wholesaler?.express_delivery_fee || wholesaler?.delivery_fee || 0)
                        : Number(wholesaler?.delivery_fee || 0)

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        shipmentMethod === option.value ? 'border-[#0FD452] bg-[#0FD452]/5' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipment"
                        value={option.value}
                        checked={shipmentMethod === option.value}
                        onChange={() => setShipmentMethod(option.value)}
                        className="mt-0.5 h-4 w-4 text-[#0FD452] focus:ring-[#0FD452]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[#000F14]">{option.label}</p>
                          <span className="text-xs font-semibold text-gray-700">{fee === 0 ? 'Free' : formatMoney(fee)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{option.hint}</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {shipmentMethod !== 'pickup' && (
                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <MapPin className="h-3 w-3 text-[#0FD452]" /> Delivery address
                  </span>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Pharmacy street, ward, district"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                  />
                </label>
              )}

              <label className="mt-3 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Calendar className="h-3 w-3 text-[#0FD452]" /> Expected delivery date
                </span>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(event) => setExpectedDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </label>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#000F14]">
                <CreditCard className="h-4 w-4 text-[#0FD452]" />
                Payment method
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    paymentMethod === 'cash' ? 'border-[#0FD452] bg-[#0FD452]/5' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className={`h-4 w-4 ${paymentMethod === 'cash' ? 'text-[#0FD452]' : 'text-gray-400'}`} />
                  <p className="mt-1 text-sm font-semibold text-[#000F14]">Cash</p>
                  <p className="text-[11px] text-gray-500">Pay on delivery or pickup</p>
                </button>
                <button
                  type="button"
                  disabled={!wholesaler?.accepts_credit}
                  onClick={() => setPaymentMethod('credit')}
                  className={`rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    paymentMethod === 'credit' ? 'border-[#0FD452] bg-[#0FD452]/5' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className={`h-4 w-4 ${paymentMethod === 'credit' ? 'text-[#0FD452]' : 'text-gray-400'}`} />
                  <p className="mt-1 text-sm font-semibold text-[#000F14]">Credit</p>
                  <p className="text-[11px] text-gray-500">
                    {wholesaler?.accepts_credit ? `${wholesaler?.payment_terms_days || 0} day account` : 'Not offered'}
                  </p>
                </button>
              </div>

              {paymentMethod === 'credit' && (
                <label className="mt-3 block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <CreditCard className="h-3 w-3 text-[#0FD452]" /> Credit account number
                  </span>
                  <input
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="e.g. ACC-TEMEKE-001"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    The supplier uses this account number to confirm and prepare your order.
                  </p>
                </label>
              )}

              <label className="mt-3 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <FileText className="h-3 w-3 text-[#0FD452]" /> Notes for the supplier
                </span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Delivery instructions, preferred brands..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20"
                />
              </label>

              {orderError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {orderError}
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={placing || cartLines.length === 0 || belowMinimum}
                className="btn-primary mt-4 w-full justify-center"
              >
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Place order · {formatMoney(total)}
              </button>
              <p className="mt-2 text-center text-[11px] text-gray-400">
                The supplier confirms and prepares your order before dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPlacedOrder(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button onClick={() => setPlacedOrder(null)} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0FD452]/10">
              <CheckCircle2 className="h-7 w-7 text-[#0FD452]" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#000F14]">Order sent to the supplier</h3>
            <p className="mt-1 text-sm text-gray-500">
              {placedOrder.order_id} · {formatMoney(placedOrder.total_amount)}
            </p>
            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Track confirmation, preparation, dispatch and delivery from your wholesale orders page.
            </p>
            <div className="mt-5 flex gap-2">
              <Link
                to={`${base}/wholesale-orders/${placedOrder.id}`}
                className="btn-primary flex-1 justify-center"
                onClick={() => setPlacedOrder(null)}
              >
                Track order
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => setPlacedOrder(null)} className="btn-secondary">
                Keep shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PillIcon() {
  return <Package className="h-4 w-4 text-[#0FD452]" />
}
