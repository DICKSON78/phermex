import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import api from '../services/api';

const steps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const stepLabels = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered'];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.data || res.data)).catch(() => {});
  }, [id]);

  if (!order) return <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" /></div>;

  const currentIdx = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-8">
      <div className="bg-white px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-[#000F14]">Order Details</h1>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
          {order.status}
        </span>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Order code</span>
            <span className="font-medium">#{order.order_code || order.id}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Pharmacy</span>
            <span className="font-medium">{order.pharmacy?.name || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Date</span>
            <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-400 mb-4">Status Timeline</h3>
            <div className="space-y-0">
              {steps.map((step, idx) => {
                const done = idx <= currentIdx;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {done ? (
                        <CheckCircle size={20} className="text-[#0FD452] shrink-0" />
                      ) : (
                        <Circle size={20} className="text-gray-300 shrink-0" />
                      )}
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-6 ${done ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <span className={`text-sm ${done ? 'font-medium text-[#000F14]' : 'text-gray-400'}`}>
                      {stepLabels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-3">Items</h3>
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-[#000F14]">{item.drug?.name || item.name || 'Drug'}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × {Number(item.unit_price || item.price || 0).toLocaleString('en-TZ')} TZS</p>
              </div>
              <span className="text-sm font-bold text-[#000F14]">
                {(Number(item.unit_price || item.price || 0) * item.quantity).toLocaleString('en-TZ')} TZS
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm font-bold text-[#000F14]">Total</span>
            <span className="text-sm font-bold text-[#0FD452]">{Number(order.total || 0).toLocaleString('en-TZ')} TZS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
