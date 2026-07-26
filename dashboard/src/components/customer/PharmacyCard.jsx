import { Star } from 'lucide-react';

export default function PharmacyCard({ pharmacy, onClick }) {
  const isOpen = pharmacy.is_open ?? pharmacy.is_open_now ?? true;
  const distance = pharmacy.distance ? `${pharmacy.distance.toFixed(1)} km` : '';
  const rating = pharmacy.rating || 4.5;
  const prepTime = pharmacy.average_prep_time || '~15 min';

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl border border-gray-100 p-0 text-left w-[280px] shrink-0 active:scale-[0.97] transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden"
    >
      <div className="relative h-28 bg-gradient-to-br from-[#0FD452]/5 to-[#0FD452]/15 flex items-center justify-center">
        <div className="text-4xl opacity-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="1.5">
            <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
          isOpen ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">{pharmacy.name}</h3>
        {pharmacy.pharmacy_type && (
          <span className="inline-block mt-1.5 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
            {pharmacy.pharmacy_type}
          </span>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {rating}
            </span>
            {distance && (
              <span className="text-xs text-gray-400 font-medium">{distance}</span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-gray-400">{prepTime}</span>
        </div>
      </div>
    </button>
  );
}
