import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Upload, StickyNote } from 'lucide-react';
import api from '../../services/api';
import AlertModal from '../../components/customer/AlertModal';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ pharmacyId: null, items: [] });
  const [prescriptionPhoto, setPrescriptionPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    const stored = sessionStorage.getItem('pharmex_cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    sessionStorage.setItem('pharmex_cart', JSON.stringify(newCart));
  };

  const updateQty = (drugId, delta) => {
    const items = cart.items.map((i) => {
      if (i.drug_id === drugId || i.id === drugId) {
        const qty = i.quantity + delta;
        return qty > 0 ? { ...i, quantity: qty } : null;
      }
      return i;
    }).filter(Boolean);
    updateCart({ ...cart, items });
  };

  const removeItem = (drugId) => {
    updateCart({ ...cart, items: cart.items.filter((i) => (i.drug_id || i.id) !== drugId) });
  };

  const subtotal = cart.items.reduce((s, i) => s + (Number(i.selling_price || i.price) * i.quantity), 0);
  const deliveryFee = 2000;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        pharmacy_id: cart.pharmacyId,
        items: cart.items.map((i) => ({ drug_id: i.drug_id || i.id, quantity: i.quantity })),
        notes: notes || undefined,
      };
      if (prescriptionPhoto) payload.prescription_photo = prescriptionPhoto;
      const res = await api.post('/customer-app/orders', payload);
      sessionStorage.removeItem('pharmex_cart');
      const orderId = res.data?.data?.id || res.data?.id;
      const orderCode = res.data?.data?.order_code || res.data?.order_code || 'N/A';
      setAlert({
        open: true,
        type: 'success',
        title: 'Order Placed!',
        message: `Your order #${orderCode} has been placed successfully. The pharmacy will confirm shortly.`,
        _action: () => navigate(`/orders/${orderId}/track`),
      });
    } catch (err) {
      setAlert({
        open: true,
        type: 'error',
        title: 'Order Failed',
        message: err.response?.data?.message || 'Failed to place order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        </div>
        <p className="text-base font-bold text-gray-900 mb-1">Your cart is empty</p>
        <p className="text-sm text-gray-400 mb-5">Browse pharmacies and add medicines</p>
        <button onClick={() => navigate('/')} className="bg-[#0FD452] text-[#000F14] rounded-2xl font-bold text-sm px-8 py-3.5 active:scale-95 transition-transform">
          Browse Pharmacies
        </button>

        <AlertModal
          isOpen={alert.open}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert({ ...alert, open: false })}
          onAction={() => { setAlert({ ...alert, open: false }); alert._action?.(); }}
          actionLabel={alert.type === 'success' ? 'Track Order' : 'Try Again'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-32">
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">My Cart</h1>
          <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{cart.items.length} items</span>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {cart.items.map((item) => (
          <div key={item.drug_id || item.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2"><path d="M12 2L12 22M2 12L22 12"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 truncate">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{Number(item.selling_price || item.price).toLocaleString('en-TZ')} TZS each</p>
              </div>
              <button onClick={() => removeItem(item.drug_id || item.id)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-0 bg-gray-50 rounded-xl overflow-hidden">
                <button onClick={() => updateQty(item.drug_id || item.id, -1)} className="w-9 h-9 flex items-center justify-center active:bg-gray-200 transition-colors">
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.drug_id || item.id, 1)} className="w-9 h-9 flex items-center justify-center bg-[#0FD452] text-[#000F14] active:bg-[#0cb843] transition-colors">
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
              <span className="text-base font-bold text-gray-900">
                {(Number(item.selling_price || item.price) * item.quantity).toLocaleString('en-TZ')} <span className="text-xs font-medium text-gray-400">TZS</span>
              </span>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500">Order Notes</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none resize-none border-0"
            rows={2}
          />
        </div>

        <label className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
            <Upload size={16} className="text-[#0FD452]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Upload Prescription</p>
            <p className="text-xs text-gray-400">Optional - attach a photo</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setPrescriptionPhoto(e.target.files[0])} />
        </label>
        {prescriptionPhoto && (
          <p className="text-xs text-[#0FD452] font-medium pl-1">✓ {prescriptionPhoto.name}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-[1000] safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-sm mb-3 px-1">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-medium text-gray-900">{subtotal.toLocaleString('en-TZ')} TZS</span>
          </div>
          <div className="flex justify-between text-sm mb-3 px-1">
            <span className="text-gray-400">Delivery fee</span>
            <span className="font-medium text-gray-900">{deliveryFee.toLocaleString('en-TZ')} TZS</span>
          </div>
          <div className="flex justify-between text-base font-bold mb-4 px-1 pt-3 border-t border-gray-100">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{total.toLocaleString('en-TZ')} <span className="text-xs font-medium text-gray-400">TZS</span></span>
          </div>
          <button
            onClick={placeOrder}
            disabled={loading}
            className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm shadow-[#0FD452]/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#000F14] border-t-transparent rounded-full animate-spin" />
                Placing order...
              </span>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, open: false })}
        onAction={() => { setAlert({ ...alert, open: false }); alert._action?.(); }}
        actionLabel={alert.type === 'success' ? 'Track Order' : 'Try Again'}
      />
    </div>
  );
}
