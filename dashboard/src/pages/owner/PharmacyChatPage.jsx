import { useState, useEffect, useRef } from 'react';
import { toArray } from '../../utils/safeData';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Phone, AlertTriangle, Pill, FileText } from 'lucide-react';
import { currentBase } from '../../utils/roles'
import api from '../../services/api';
import toast from 'react-hot-toast';

const typeConfig = {
  text: { label: 'Text', color: 'bg-gray-100 text-gray-600' },
  emergency: { label: 'Emergency', color: 'bg-red-50 text-red-600' },
  order_inquiry: { label: 'Order', color: 'bg-blue-50 text-blue-600' },
  prescription_inquiry: { label: 'Rx', color: 'bg-purple-50 text-purple-600' },
};

export default function PharmacyChatPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [customer, setCustomer] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [customerId]);

  const loadMessages = () => {
    api.get(`/chats/${customerId}`).then((res) => {
      const msgs = toArray(res.data);
      setMessages(msgs);
      if (msgs.length > 0 && !customer) {
        setCustomer(msgs[0].sender_id == customerId ? msgs[0].sender : { name: 'Customer', phone: '' });
      }
    }).catch(() => {});
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/chats/${customerId}`, { message: input.trim() });
      setMessages((prev) => [...prev, res.data.data]);
      setInput('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 shrink-0 flex items-center gap-3">
        <button onClick={() => navigate(`${currentBase()}/chats`)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-sm truncate">{customer?.name || 'Customer'}</h1>
          <p className="text-[10px] text-[#0FD452] font-medium">Online</p>
        </div>
        {customer?.phone && (
          <a href={`tel:${customer.phone}`} className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
            <Phone size={16} className="text-[#0FD452]" />
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f5f7f5]">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Reply to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id != customerId;
            const typeInfo = typeConfig[msg.message_type] || typeConfig.text;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  {!isMe && msg.message_type !== 'text' && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-[#0FD452] text-[#000F14] rounded-br-md'
                      : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && msg.is_read && <span className="ml-1 text-[#0FD452]">✓✓</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your reply..."
              className="w-full bg-gray-50 border-0 rounded-2xl pl-4 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40"
          >
            <Send size={16} className="text-[#000F14]" />
          </button>
        </div>
      </div>
    </div>
  );
}
