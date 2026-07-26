import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import PharmacyCard from '../components/PharmacyCard';

const defaultPos = [-6.7924, 39.2083];

const greenIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function HomePage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState(defaultPos);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  useEffect(() => {
    api.get('/nearby', { params: { lat: pos[0], lng: pos[1], radius_km: 10, search } })
      .then((res) => setPharmacies(res.data.data || res.data))
      .catch(() => {});
  }, [pos, search]);

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      <div className="px-4 pt-5 pb-3 bg-white">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pharmacies or medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f5f7f5] border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>
      </div>

      <div className="relative h-[35vh]">
        <MapContainer center={pos} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://osm.org">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} icon={greenIcon}>
            <Popup>You are here</Popup>
          </Marker>
          {pharmacies.map((p) => (
            <Marker
              key={p.id}
              position={[p.latitude || p.lat || pos[0], p.longitude || p.lng || pos[1]]}
              icon={greenIcon}
              eventHandlers={{ click: () => navigate(`/pharmacy/${p.id}`) }}
            >
              <Popup>{p.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
        <button
          onClick={useMyLocation}
          className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg z-[1000] border border-gray-100"
        >
          <MapPin size={18} className="text-[#0FD452]" />
        </button>
      </div>

      <div className="px-4 pt-5">
        <h2 className="text-base font-bold text-[#000F14] mb-3">Nearby Pharmacies</h2>
        {pharmacies.length === 0 ? (
          <p className="text-sm text-gray-400">No pharmacies found nearby.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {pharmacies.map((p) => (
              <PharmacyCard key={p.id} pharmacy={p} onClick={() => navigate(`/pharmacy/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
