import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Package, MapPin, Navigation } from 'lucide-react';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const steps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const stepLabels = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'];

const statusConfig = {
  pending: { color: 'bg-amber-50 text-amber-600', label: 'Pending' },
  confirmed: { color: 'bg-blue-50 text-blue-600', label: 'Confirmed' },
  preparing: { color: 'bg-purple-50 text-purple-600', label: 'Preparing' },
  ready: { color: 'bg-emerald-50 text-emerald-600', label: 'Ready' },
  delivered: { color: 'bg-green-50 text-green-600', label: 'Delivered' },
  cancelled: { color: 'bg-red-50 text-red-600', label: 'Cancelled' },
};

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/customer-app/orders/${id}`).then((res) => setOrder(res.data.data || res.data)).catch(() => {});
  }, [id]);

  if (!order) return (
    <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentIdx = steps.indexOf(order.order_status || order.status);
  const isCancelled = (order.order_status || order.status) === 'cancelled';
  const isDelivered = (order.order_status || order.status) === 'delivered';
  const status = statusConfig[order.order_status || order.status] || { color: 'bg-gray-100 text-gray-500', label: order.order_status || order.status };
  const canTrack = !isCancelled && !isDelivered && currentIdx >= 0;

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-8 overflow-y-auto">
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Order Details</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
                <Package size={18} className="text-[#0FD452]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">#{order.order_code || order.id}</p>
                <p className="text-sm font-bold text-gray-900">{order.pharmacy?.pharmacy_name || 'Pharmacy'}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-50">
            <MapPin size={12} />
            <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Track Delivery button */}
        {canTrack && (
          <button
            onClick={() => navigate(`/orders/${id}/track`)}
            className="w-full bg-[#000F14] text-white rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Navigation size={16} />
            Track Delivery on Map
          </button>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Order Timeline</h3>
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done ? 'bg-[#0FD452]' : 'bg-gray-100'
                      } ${isCurrent ? 'ring-4 ring-[#0FD452]/10' : ''}`}>
                        {done ? (
                          <CheckCircle size={16} className="text-white" strokeWidth={2.5} />
                        ) : (
                          <Circle size={16} className="text-gray-300" />
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-8 ${done && idx < currentIdx ? 'bg-[#0FD452]' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <span className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stepLabels[idx]}
                      </span>
                      {isCurrent && <span className="ml-2 text-[10px] font-bold text-[#0FD452]">Current</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Items</h3>
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2"><path d="M12 2L12 22M2 12L22 12"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.drug?.name || item.name || 'Drug'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {(Number(item.unit_price || item.price || 0) * item.quantity).toLocaleString('en-TZ')} <span className="text-[10px] font-medium text-gray-400">TZS</span>
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 pt-4 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-base font-bold text-[#0FD452]">{Number(order.total || 0).toLocaleString('en-TZ')} <span className="text-xs font-medium">TZS</span></span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
