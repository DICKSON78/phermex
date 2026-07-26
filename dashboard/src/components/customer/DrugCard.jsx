import { Plus, Minus, ShoppingCart } from 'lucide-react';

export default function DrugCard({ drug, quantity, onAdd, onRemove }) {
  const inStock = drug.quantity > 0 || drug.stock_quantity > 0 || drug.in_stock !== false;
  const price = Number(drug.selling_price || drug.price || 0).toLocaleString('en-TZ');

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 transition-all duration-200 ${quantity > 0 ? 'border-[#0FD452]/30 shadow-sm shadow-[#0FD452]/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0FD452]/10 to-[#0FD452]/5 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-900 truncate">{drug.name}</h3>
          {drug.generic_name && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{drug.generic_name}</p>
          )}
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-sm font-bold text-[#0FD452]">{price} <span className="text-[10px] font-medium text-gray-400">TZS</span></p>
            {!inStock ? (
              <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
                Out of Stock
              </span>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-0 bg-[#0FD452] rounded-xl overflow-hidden">
                <button onClick={onRemove} className="w-8 h-8 flex items-center justify-center text-[#000F14] active:bg-[#0cb843] transition-colors">
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span className="text-sm font-bold text-[#000F14] w-6 text-center">{quantity}</span>
                <button onClick={onAdd} className="w-8 h-8 flex items-center justify-center text-[#000F14] active:bg-[#0cb843] transition-colors">
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={onAdd}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-[#0FD452] active:text-[#000F14] transition-all duration-200"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
