import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, ChevronRight, Clock, Package, Phone, Star, X, Navigation, Upload, Pill, MessageCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';
import InstallPrompt from '../../components/customer/InstallPrompt';

const defaultPos = [-6.7924, 39.2083];

const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 2px 10px rgba(13,212,82,.4);display:flex;align-items:center;justify-content:center">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M9 12h6m-3-3v6"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, 14, { duration: 1 }); }, [pos]);
  return null;
}

const statusColors = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  preparing: 'bg-purple-50 text-purple-600',
  ready: 'bg-emerald-50 text-emerald-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
};

export default function CustomerHomePage() {
  const [pharmacies, setPharmacies] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [pos, setPos] = useState(defaultPos);
  const [loading, setLoading] = useState(true);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/customer-app/nearby', { params: { latitude: pos[0], longitude: pos[1], radius_km: 10, search: debouncedSearch } }),
      api.get('/customer-app/orders').catch(() => ({ data: { data: { data: [] } } })),
      api.get('/customer-app/notifications/unread-count').catch(() => ({ data: { data: { count: 0 } } })),
      api.get('/customer-app/me').catch(() => ({ data: { data: {} } })),
    ])
      .then(([pharmRes, ordersRes, notifRes, meRes]) => {
        setPharmacies(pharmRes.data.data || pharmRes.data || []);
        const od = ordersRes.data;
        setRecentOrders((od.data?.data || od.data || []).slice(0, 3));
        setUnreadCount(notifRes.data?.data?.count || 0);
        setUserName(meRes.data?.data?.name || meRes.data?.name || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pos, debouncedSearch]);

  const openPharmacySheet = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowBottomSheet(true);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    const name = userName ? ` ${userName.split(' ')[0]}` : '';
    if (h < 12) return `Good Morning${name}`;
    if (h < 17) return `Good Afternoon${name}`;
    return `Good Evening${name}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">{getGreeting()}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">Find Your Medicine</h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center active:scale-95 transition-transform relative"
          >
            <Bell size={18} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines or pharmacies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border-0 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const el = document.getElementById('nearby-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#0FD452] rounded-2xl p-5 text-left active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20"
          >
            <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center mb-3">
              <Pill size={24} className="text-[#000F14]" />
            </div>
            <p className="text-sm font-bold text-[#000F14]">Order Medicine</p>
            <p className="text-[10px] text-[#000F14]/50 mt-0.5">Find & order drugs nearby</p>
          </button>
          <button
            onClick={() => navigate('/prescriptions')}
            className="bg-white border border-gray-100 rounded-2xl p-5 text-left active:scale-[0.97] transition-all"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
              <Upload size={24} className="text-purple-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Upload Rx</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Submit prescription</p>
          </button>
        </div>
      </div>

      {/* Active Order Banner */}
      {recentOrders.some((o) => {
        const s = o.order_status || o.status;
        return s && s !== 'delivered' && s !== 'cancelled';
      }) && (
        <div className="px-5 mt-4">
          {recentOrders
            .filter((o) => {
              const s = o.order_status || o.status;
              return s && s !== 'delivered' && s !== 'cancelled';
            })
            .slice(0, 1)
            .map((order) => (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}/track`)}
                className="w-full bg-[#000F14] rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center shrink-0 animate-pulse-green">
                  <Package size={16} className="text-[#000F14]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-white/60">Active Order</p>
                  <p className="text-sm font-bold text-white">#{order.order_code || order.id}</p>
                </div>
                <div className="flex items-center gap-1 text-[#0FD452]">
                  <span className="text-xs font-bold">Track</span>
                  <Navigation size={12} />
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
            <button onClick={() => navigate('/orders')} className="text-xs font-bold text-[#0FD452] flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2.5">
            {recentOrders.map((order) => {
              const orderStatus = order.order_status || order.status;
              const sc = statusColors[orderStatus] || 'bg-gray-100 text-gray-500';
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-[#0FD452]" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 truncate">{order.pharmacy?.pharmacy_name || 'Pharmacy'}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${sc}`}>
                        {orderStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">#{order.order_code || order.id}</p>
                      <p className="text-xs font-bold text-gray-900">{Number(order.total || 0).toLocaleString('en-TZ')} TZS</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nearby Pharmacies */}
      <div id="nearby-section" className="px-5 mt-5 scroll-mt-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Nearby Pharmacies</h2>
          <span className="text-xs text-gray-400 font-medium">{pharmacies.length} found</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <MapPin size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No pharmacies found nearby</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pharmacies.map((p) => {
              const distance = p.distance ? `${p.distance.toFixed(1)} km` : '';
              const rating = p.rating || 4.5;
              const isOpen = p.is_open ?? p.is_open_now ?? true;
              const phone = p.phone || p.user?.phone || '';
              return (
                <button
                  key={p.id}
                  onClick={() => openPharmacySheet(p)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0FD452]/10 to-[#0FD452]/5 flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{p.pharmacy_name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.pharmacy_type || 'Pharmacy'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {distance && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Navigation size={8} /> {distance}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star size={8} className="fill-amber-400" /> {rating}
                        </span>
                        {phone && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Phone size={8} /> Has Phone
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pharmacy/${p.id}/drugs`);
                      }}
                      className="flex-1 bg-[#0FD452] text-[#000F14] rounded-xl py-2.5 text-xs font-bold active:scale-95 transition-all"
                    >
                      Order Now
                    </button>
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Phone size={14} className="text-[#0FD452]" />
                      </a>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pharmacy Bottom Sheet */}
      {showBottomSheet && selectedPharmacy && (
        <div className="fixed inset-0 z-[2000]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBottomSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="mx-4 h-36 rounded-2xl overflow-hidden">
              <MapContainer
                center={[selectedPharmacy.latitude || pos[0], selectedPharmacy.longitude || pos[1]]}
                zoom={14}
                className="h-full w-full"
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker
                  position={[selectedPharmacy.latitude || pos[0], selectedPharmacy.longitude || pos[1]]}
                  icon={pharmacyIcon}
                />
                <Marker position={pos} icon={userIcon} />
              </MapContainer>
            </div>
            <div className="px-5 pt-4 pb-6 flex-1 overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedPharmacy.pharmacy_name}</h2>
                  <p className="text-sm text-gray-400 capitalize">{selectedPharmacy.pharmacy_type || 'Pharmacy'}</p>
                </div>
                <button onClick={() => setShowBottomSheet(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Navigation size={16} className="text-[#0FD452] mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{selectedPharmacy.distance ? `${selectedPharmacy.distance.toFixed(1)} km` : 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">Distance</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Star size={16} className="text-amber-400 fill-amber-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">{selectedPharmacy.rating || 4.5}</p>
                  <p className="text-[10px] text-gray-400">Rating</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock size={16} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900">~15 min</p>
                  <p className="text-[10px] text-gray-400">Prep Time</p>
                </div>
              </div>
              {(selectedPharmacy.phone || selectedPharmacy.user?.phone) && (
                <a
                  href={`tel:${selectedPharmacy.phone || selectedPharmacy.user?.phone}`}
                  className="flex items-center gap-3 bg-green-50 rounded-2xl p-4 mb-3 active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center">
                    <Phone size={18} className="text-[#000F14]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Call Pharmacy</p>
                    <p className="text-xs text-gray-500">{selectedPharmacy.phone || selectedPharmacy.user?.phone}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              )}
              {selectedPharmacy.working_hours && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-3">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{typeof selectedPharmacy.working_hours === 'object' ? `${selectedPharmacy.working_hours.open} - ${selectedPharmacy.working_hours.close}` : selectedPharmacy.working_hours}</span>
                </div>
              )}
              {selectedPharmacy.address && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-4">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{selectedPharmacy.address}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBottomSheet(false);
                    navigate(`/chat/${selectedPharmacy.id}`);
                  }}
                  className="flex-1 bg-white border-2 border-[#0FD452] text-[#0FD452] rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                >
                  <MessageCircle size={18} />
                  Chat
                </button>
                <button
                  onClick={() => {
                    setShowBottomSheet(false);
                    navigate(`/pharmacy/${selectedPharmacy.id}/drugs`);
                  }}
                  className="flex-1 bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20"
                >
                  <Pill size={18} />
                  Browse Drugs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
