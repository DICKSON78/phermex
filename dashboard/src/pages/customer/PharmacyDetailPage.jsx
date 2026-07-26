import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, Star, Pill, Upload, Navigation, Share2, MessageCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 4px 15px rgba(13,212,82,.35);display:flex;align-items:center;justify-content:center">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function PharmacyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get(`/customer-app/pharmacies/${id}`).then((res) => {
      const d = res.data;
      setPharmacy(d.data?.pharmacy || d.data || d);
    }).catch(() => {});
    api.get(`/customer-app/pharmacies/${id}/categories`).then((res) => setCategories(res.data.data || res.data || [])).catch(() => {});
  }, [id]);

  if (!pharmacy) return (
    <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pos = [pharmacy.latitude || -6.79, pharmacy.longitude || 39.20];
  const isOpen = pharmacy.is_open ?? pharmacy.is_open_now ?? true;
  const phone = pharmacy.phone || pharmacy.user?.phone || '';

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-24">
      {/* Map header */}
      <div className="relative h-52">
        <MapContainer center={pos} zoom={15} className="h-full w-full" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={pos} icon={pharmacyIcon} />
        </MapContainer>
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[1000]">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex gap-2">
            {phone && (
              <a href={`tel:${phone}`} className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
                <Phone size={18} className="text-[#0FD452]" />
              </a>
            )}
            <button className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform">
              <Share2 size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="px-4 -mt-8 relative z-[1000]">
        <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pharmacy.pharmacy_name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {pharmacy.pharmacy_type && (
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full capitalize">{pharmacy.pharmacy_type}</span>
                )}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>
            {pharmacy.rating && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-amber-700">{pharmacy.rating}</span>
              </div>
            )}
          </div>

          {/* Phone - prominent */}
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-3 bg-green-50 rounded-2xl p-3.5 mb-3 active:scale-[0.98] transition-all">
              <div className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center shrink-0">
                <Phone size={18} className="text-[#000F14]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Call to Order / Inquire</p>
                <p className="text-xs text-gray-500">{phone}</p>
              </div>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-[#0FD452]" />
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <MessageCircle size={14} className="text-[#0FD452]" />
                </div>
              </div>
            </a>
          )}

          <div className="space-y-2.5">
            {pharmacy.working_hours && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Clock size={14} className="text-gray-500" />
                </div>
                <span className="text-sm text-gray-600">{typeof pharmacy.working_hours === 'object' ? `${pharmacy.working_hours.open} - ${pharmacy.working_hours.close}` : pharmacy.working_hours}</span>
              </div>
            )}
            {(pharmacy.address || pharmacy.ward || pharmacy.district) && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Navigation size={14} className="text-gray-500" />
                </div>
                <span className="text-sm text-gray-600">{pharmacy.address || `${pharmacy.ward || ''} ${pharmacy.district || ''}`.trim()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => navigate(`/pharmacy/${id}/drugs`)}
              className="flex-1 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-3.5 flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20"
            >
              <Pill size={18} />
              Browse Drugs
            </button>
            <button
              onClick={() => navigate(`/checkout?pharmacy_id=${id}&type=prescription`)}
              className="w-14 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Upload size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 mt-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id || cat.name}
                onClick={() => navigate(`/pharmacy/${id}/drugs?category=${cat.slug || cat.name}`)}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.97] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center mb-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <p className="text-sm font-bold text-gray-900">{cat.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
