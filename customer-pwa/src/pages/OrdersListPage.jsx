import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const tabs = ['All', 'Active', 'Completed'];

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/orders')
      .then((res) => setOrders(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (tab === 'Active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status);
    if (tab === 'Completed') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      <div className="bg-white px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-[#000F14]">My Orders</h1>
        <div className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t ? 'bg-white text-[#000F14] shadow-sm' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No orders yet</p>
          </div>
        ) : (
          filtered.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left active:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-400">#{order.order_code || order.id}</p>
                  <p className="text-sm font-semibold text-[#000F14]">{order.pharmacy?.name || 'Pharmacy'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{order.items_count || order.items?.length || 0} item(s)</span>
                <span className="font-bold text-[#000F14]">{Number(order.total || 0).toLocaleString('en-TZ')} TZS</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
