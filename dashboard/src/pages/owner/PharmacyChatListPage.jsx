import { useState, useEffect } from 'react';
import { toArray } from '../../utils/safeData';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, AlertTriangle, Pill, FileText } from 'lucide-react';
import { currentBase } from '../../utils/roles'
import api from '../../services/api';

const typeIcons = {
  text: null,
  emergency: <AlertTriangle size={12} className="text-red-500" />,
  order_inquiry: <Pill size={12} className="text-blue-500" />,
  prescription_inquiry: <FileText size={12} className="text-purple-500" />,
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PharmacyChatListPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/chats')
      .then((res) => setConversations(toArray(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Respond to customer inquiries and urgent requests</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={24} className="text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">No messages yet</p>
          <p className="text-sm text-gray-400">Customer messages will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.customer_id}
              onClick={() => navigate(`${currentBase()}/chats/${conv.customer_id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.98] transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0FD452]/10 to-[#0FD452]/5 flex items-center justify-center shrink-0 relative">
                  <span className="text-sm font-bold text-[#0FD452]">
                    {(conv.customer_name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{conv.customer_name}</h3>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{timeAgo(conv.last_message_time)}</span>
                  </div>
                  {conv.customer_phone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">{conv.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {typeIcons[conv.message_type]}
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
