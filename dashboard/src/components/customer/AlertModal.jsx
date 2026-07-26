import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={48} className="text-[#0FD452]" strokeWidth={1.5} />,
  error: <XCircle size={48} className="text-red-500" strokeWidth={1.5} />,
  warning: <AlertTriangle size={48} className="text-amber-500" strokeWidth={1.5} />,
  info: <Info size={48} className="text-blue-500" strokeWidth={1.5} />,
};

const bgColors = {
  success: 'bg-[#0FD452]/10',
  error: 'bg-red-50',
  warning: 'bg-amber-50',
  info: 'bg-blue-50',
};

const btnColors = {
  success: 'bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14]',
  error: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  info: 'bg-blue-500 hover:bg-blue-600 text-white',
};

export default function AlertModal({ isOpen, type = 'success', title, message, onClose, onAction, actionLabel }) {
  useEffect(() => {
    if (isOpen && type === 'success') {
      const t = setTimeout(() => onClose?.(), 3000);
      return () => clearTimeout(t);
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center px-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-3xl p-8 w-full max-w-xs text-center animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <X size={14} className="text-gray-500" />
        </button>
        <div className={`w-20 h-20 ${bgColors[type]} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {icons[type]}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={onAction || onClose}
          className={`w-full ${btnColors[type]} rounded-2xl font-bold text-sm py-3.5 active:scale-[0.97] transition-all`}
        >
          {actionLabel || (type === 'success' ? 'OK' : type === 'error' ? 'Try Again' : 'Got it')}
        </button>
      </div>
    </div>
  );
}
