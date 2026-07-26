import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Upload } from 'lucide-react';
import api from '../services/api';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ pharmacyId: null, items: [] });
  const [prescriptionPhoto, setPrescriptionPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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

  const subtotal = cart.items.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        pharmacy_id: cart.pharmacyId,
        items: cart.items.map((i) => ({ drug_id: i.drug_id || i.id, quantity: i.quantity })),
        notes: notes || undefined,
      };
      if (prescriptionPhoto) payload.prescription_photo = prescriptionPhoto;
      const res = await api.post('/orders', payload);
      sessionStorage.removeItem('pharmex_cart');
      const orderId = res.data?.data?.id || res.data?.id;
      navigate('/checkout', { state: { orderId, code: res.data?.data?.order_code || res.data?.order_code || 'N/A' } });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex flex-col items-center justify-center px-6">
        <p className="text-gray-400 text-sm mb-4">Your cart is empty</p>
        <button onClick={() => navigate('/')} className="bg-[#0FD452] text-[#000F14] rounded-xl font-bold text-sm px-6 py-3">
          Browse Pharmacies
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-8">
      <div className="bg-white px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-[#000F14]">My Cart</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {cart.items.map((item) => (
          <div key={item.drug_id || item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="font-semibold text-sm text-[#000F14] truncate">{item.name}</h3>
                <p className="text-sm font-bold text-[#0FD452] mt-1">
                  {Number(item.price).toLocaleString('en-TZ')} TZS
                </p>
              </div>
              <button onClick={() => removeItem(item.drug_id || item.id)} className="text-red-400 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                <button onClick={() => updateQty(item.drug_id || item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.drug_id || item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0FD452]">
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-sm font-bold text-[#000F14]">
                {(Number(item.price) * item.quantity).toLocaleString('en-TZ')} TZS
              </span>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Order notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none resize-none"
            rows={2}
          />
        </div>

        <label className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 cursor-pointer">
          <Upload size={18} className="text-[#0FD452]" />
          <div>
            <p className="text-sm font-medium text-[#000F14]">Upload Prescription (optional)</p>
            <p className="text-xs text-gray-400">Tap to select a photo</p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPrescriptionPhoto(e.target.files[0])}
          />
        </label>

        {prescriptionPhoto && (
          <p className="text-xs text-green-600">✓ {prescriptionPhoto.name}</p>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">{cart.items.length} item(s)</p>
            <p className="text-lg font-bold text-[#000F14]">{subtotal.toLocaleString('en-TZ')} TZS</p>
          </div>
        </div>

        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3.5 disabled:opacity-50"
        >
          {loading ? 'Placing order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
