import { Plus, Minus } from 'lucide-react';

export default function DrugCard({ drug, quantity, onAdd, onRemove }) {
  const inStock = drug.stock_quantity > 0 || drug.in_stock !== false;
  const price = Number(drug.price || 0).toLocaleString('en-TZ');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-sm text-[#000F14] truncate">{drug.name}</h3>
          {drug.generic_name && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{drug.generic_name}</p>
          )}
          <p className="text-sm font-bold text-[#0FD452] mt-1">{price} TZS</p>
        </div>
        <div className="shrink-0">
          {!inStock ? (
            <span className="text-[10px] font-medium bg-red-50 text-red-500 px-2 py-1 rounded-full">
              Out of Stock
            </span>
          ) : quantity > 0 ? (
            <div className="flex items-center gap-2 bg-[#0FD452]/10 rounded-xl px-2 py-1">
              <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white">
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold w-5 text-center">{quantity}</span>
              <button onClick={onAdd} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0FD452]">
                <Plus size={14} className="text-[#000F14]" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0FD452] text-[#000F14]"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
