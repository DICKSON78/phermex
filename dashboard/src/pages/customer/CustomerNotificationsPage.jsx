import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const typeIcons = {
  info: <Info size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  success: <CheckCircle size={16} className="text-[#0FD452]" />,
  danger: <XCircle size={16} className="text-red-500" />,
};

const typeBg = {
  info: 'bg-blue-50',
  warning: 'bg-amber-50',
  success: 'bg-[#0FD452]/10',
  danger: 'bg-red-50',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CustomerNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customer-app/notifications')
      .then((res) => {
        const items = res.data?.data?.data || res.data?.data || [];
        setNotifications(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/customer-app/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/customer-app/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleTap = (notif) => {
    markRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-lg">Notifications</h1>
            {unread.length > 0 && (
              <p className="text-xs text-gray-400">{unread.length} unread</p>
            )}
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-[#0FD452] flex items-center gap-1 active:scale-95"
            >
              <CheckCheck size={14} /> Read all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Bell size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you about orders and updates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleTap(notif)}
                className={`w-full text-left rounded-2xl p-4 flex items-start gap-3 active:scale-[0.98] transition-all ${
                  notif.is_read ? 'bg-white border border-gray-100' : 'bg-white border border-[#0FD452]/20 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${typeBg[notif.type] || typeBg.info} flex items-center justify-center shrink-0`}>
                  {typeIcons[notif.type] || typeIcons.info}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-[#0FD452] rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
