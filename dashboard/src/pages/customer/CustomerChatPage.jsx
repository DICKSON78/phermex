import { useState, useEffect, useRef } from 'react';
import { toArray } from '../../utils/safeData';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Phone, AlertTriangle, Pill, FileText } from 'lucide-react';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const typeConfig = {
  text: { label: 'Text', color: 'bg-gray-100 text-gray-600' },
  emergency: { label: 'Emergency', color: 'bg-red-50 text-red-600' },
  order_inquiry: { label: 'Order', color: 'bg-blue-50 text-blue-600' },
  prescription_inquiry: { label: 'Rx', color: 'bg-purple-50 text-purple-600' },
};

export default function CustomerChatPage() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pharmacy, setPharmacy] = useState(null);
  const [sending, setSending] = useState(false);
  const [msgType, setMsgType] = useState('text');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const bottomRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    api.get(`/customer-app/pharmacies/${pharmacyId}`).then((res) => {
      const d = res.data;
      setPharmacy(d.data?.pharmacy || d.data || d);
    }).catch(() => {});
  }, [pharmacyId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [pharmacyId]);

  const loadMessages = () => {
    api.get(`/customer-app/chats/${pharmacyId}`).then((res) => {
      setMessages(toArray(res.data));
    }).catch(() => {});
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/customer-app/chats/${pharmacyId}`, {
        message: input.trim(),
        message_type: msgType,
      });
      setMessages((prev) => [...prev, res.data.data]);
      setInput('');
      setMsgType('text');
      setShowTypePicker(false);
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const phone = pharmacy?.phone || pharmacy?.user?.phone || '';

  return (
    <div className="min-h-screen bg-[#f5f7f5] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">{pharmacy?.pharmacy_name || 'Pharmacy'}</h1>
            <p className="text-[10px] text-gray-400">Typically replies within minutes</p>
          </div>
          {phone && (
            <a href={`tel:${phone}`} className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
              <Phone size={16} className="text-[#0FD452]" />
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Start a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Ask about drugs, prescriptions, or urgent orders</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id !== pharmacy?.owner_id;
            const typeInfo = typeConfig[msg.message_type] || typeConfig.text;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'order-1' : ''}`}>
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

      {/* Type picker */}
      {showTypePicker && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Message Type</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setMsgType(key); setShowTypePicker(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  msgType === key ? 'bg-[#0FD452] text-[#000F14]' : cfg.color
                }`}
              >
                {key === 'emergency' && <AlertTriangle size={10} className="inline mr-1" />}
                {key === 'order_inquiry' && <Pill size={10} className="inline mr-1" />}
                {key === 'prescription_inquiry' && <FileText size={10} className="inline mr-1" />}
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0 safe-area-bottom">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowTypePicker(!showTypePicker)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              msgType !== 'text' ? 'bg-[#0FD452] text-[#000F14]' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {msgType === 'emergency' ? <AlertTriangle size={16} /> :
             msgType === 'order_inquiry' ? <Pill size={16} /> :
             msgType === 'prescription_inquiry' ? <FileText size={16} /> :
             <span className="text-xs font-bold">Aa</span>}
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full bg-gray-50 border-0 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
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
