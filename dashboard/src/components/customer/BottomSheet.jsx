import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children, maxHeight = '80vh' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] flex flex-col animate-slide-up"
        style={{ maxHeight }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-95">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
