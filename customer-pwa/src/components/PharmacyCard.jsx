import { Star } from 'lucide-react';

export default function PharmacyCard({ pharmacy, onClick }) {
  const isOpen = pharmacy.is_open ?? pharmacy.is_open_now ?? true;
  const distance = pharmacy.distance ? `${pharmacy.distance.toFixed(1)} km` : '';
  const rating = pharmacy.rating || 4.5;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-4 text-left w-64 shrink-0 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-[#000F14] leading-tight pr-2">
          {pharmacy.name}
        </h3>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}
        >
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      {pharmacy.pharmacy_type && (
        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {pharmacy.pharmacy_type}
        </span>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          {rating}
        </span>
        {distance && <span>{distance}</span>}
      </div>
    </button>
  );
}
