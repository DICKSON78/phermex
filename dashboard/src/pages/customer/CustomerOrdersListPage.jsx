import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const statusConfig = {
  pending: { color: 'bg-amber-500 text-white', label: 'Pending' },
  confirmed: { color: 'bg-blue-500 text-white', label: 'Confirmed' },
  preparing: { color: 'bg-purple-500 text-white', label: 'Preparing' },
  ready: { color: 'bg-emerald-500 text-white', label: 'Ready' },
  delivered: { color: 'bg-[#0FD452] text-white', label: 'Delivered' },
  cancelled: { color: 'bg-red-500 text-white', label: 'Cancelled' },
  dispensed: { color: 'bg-[#0FD452] text-white', label: 'Dispensed' },
};

const tabs = [
  { key: 'All', label: 'All' },
  { key: 'Active', label: 'Active' },
  { key: 'Completed', label: 'Completed' },
];

export default function CustomerOrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/customer-app/orders')
      .then((res) => {
        const d = res.data;
        setOrders(d.data?.data || d.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const s = o.order_status || o.status;
    if (tab === 'Active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(s);
    if (tab === 'Completed') return ['delivered', 'cancelled', 'dispensed'].includes(s);
    return true;
  });

  const activeCount = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status || o.status)).length;
  const completedCount = orders.filter((o) => ['delivered', 'cancelled', 'dispensed'].includes(o.order_status || o.status)).length;

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((t) => {
            const isActive = tab === t.key;
            const count = t.key === 'All' ? orders.length : t.key === 'Active' ? activeCount : completedCount;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0FD452] text-[#000F14] shadow-md shadow-[#0FD452]/30'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#000F14]/10 text-[#000F14]' : 'bg-gray-200 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">No {tab.toLowerCase()} orders</p>
            <p className="text-sm text-gray-400">Your orders will appear here</p>
          </div>
        ) : (
          filtered.map((order) => {
            const s = order.order_status || order.status;
            const status = statusConfig[s] || { color: 'bg-gray-400 text-white', label: s };
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.98] transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
                      <Package size={18} className="text-[#0FD452]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">#{order.order_code || order.id}</p>
                      <p className="text-sm font-bold text-gray-900">{order.pharmacy?.pharmacy_name || 'Pharmacy'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{Number(order.total || 0).toLocaleString('en-TZ')} <span className="text-[10px] font-medium text-gray-400">TZS</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
