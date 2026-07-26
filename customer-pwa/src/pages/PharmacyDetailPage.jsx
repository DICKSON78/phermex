import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, Star, Pill, Upload } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';

const greenIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function PharmacyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get(`/pharmacies/${id}`).then((res) => setPharmacy(res.data.data || res.data)).catch(() => {});
    api.get(`/pharmacies/${id}/categories`).then((res) => setCategories(res.data.data || res.data || [])).catch(() => {});
  }, [id]);

  if (!pharmacy) return <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" /></div>;

  const pos = [pharmacy.latitude || -6.79, pharmacy.longitude || 39.20];

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      <div className="bg-white px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#000F14] truncate">{pharmacy.name}</h1>
            {pharmacy.pharmacy_type && (
              <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {pharmacy.pharmacy_type}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-44 mx-4 mt-3 rounded-2xl overflow-hidden">
        <MapContainer center={pos} zoom={15} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} icon={greenIcon} />
        </MapContainer>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          {pharmacy.address && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <span className="text-[#0FD452] mt-0.5">📍</span>
              <span>{pharmacy.address}</span>
            </div>
          )}
          {pharmacy.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone size={16} className="text-[#0FD452]" />
              <span>{pharmacy.phone}</span>
            </div>
          )}
          {pharmacy.working_hours && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock size={16} className="text-[#0FD452]" />
              <span>{pharmacy.working_hours}</span>
            </div>
          )}
          {pharmacy.rating && (
            <div className="flex items-center gap-2 text-sm">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="font-medium">{pharmacy.rating}</span>
              <span className="text-gray-400">rating</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/pharmacy/${id}/drugs`)}
            className="flex-1 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3 flex items-center justify-center gap-2"
          >
            <Pill size={16} />
            Browse Drugs
          </button>
          <button
            onClick={() => navigate(`/checkout?pharmacy_id=${id}&type=prescription`)}
            className="flex-1 border border-[#0FD452] text-[#0FD452] rounded-xl font-bold text-sm py-3 flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            Upload Rx
          </button>
        </div>

        {categories.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#000F14] mb-2">Drug Categories</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id || cat.name}
                  onClick={() => navigate(`/pharmacy/${id}/drugs?category=${cat.slug || cat.name}`)}
                  className="bg-white rounded-2xl border border-gray-200 p-3 text-left text-sm font-medium text-[#000F14] active:bg-gray-50"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
