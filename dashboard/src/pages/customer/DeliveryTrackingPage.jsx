import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Package, MapPin, Clock, CheckCircle, Navigation, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const pharmacyIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#0FD452;border:3px solid white;box-shadow:0 2px 12px rgba(13,212,82,.5);display:flex;align-items:center;justify-content:center">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M9 12h6m-3-3v6"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 10px rgba(59,130,246,.5)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const riderIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#F59E0B;border:3px solid white;box-shadow:0 2px 12px rgba(245,158,11,.5);display:flex;align-items:center;justify-content:center">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L12 22M2 12L22 12"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

const steps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Clock },
  { key: 'ready', label: 'Ready for Pickup', icon: MapPin },
  { key: 'out_for_delivery', label: 'On the Way', icon: Navigation },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function DeliveryTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemsSheet, setShowItemsSheet] = useState(false);
  const [pos, setPos] = useState([-6.7924, 39.2083]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
  }, []);

  useEffect(() => {
    const fetchOrder = () => {
      api.get(`/customer-app/orders/${id}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setOrder(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = order.order_status || order.status || 'pending';
  const currentIdx = steps.findIndex((s) => s.key === status);
  const pharmacy = order.pharmacy || {};
  const pharmacyLat = pharmacy.latitude || -6.7924;
  const pharmacyLng = pharmacy.longitude || 39.2083;
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';

  // Simulated rider position (between user and pharmacy based on progress)
  const progress = currentIdx >= 0 ? (currentIdx + 1) / steps.length : 0;
  const riderLat = pos[0] + (pharmacyLat - pos[0]) * (1 - progress * 0.3);
  const riderLng = pos[1] + (pharmacyLng - pos[1]) * (1 - progress * 0.3);

  const mapBounds = [
    [Math.min(pos[0], pharmacyLat) - 0.005, Math.min(pos[1], pharmacyLng) - 0.005],
    [Math.max(pos[0], pharmacyLat) + 0.005, Math.max(pos[1], pharmacyLng) + 0.005],
  ];

  const etaMinutes = Math.max(5, 30 - currentIdx * 5);

  return (
    <div className="min-h-screen bg-[#f5f7f5] flex flex-col pb-16">
      {/* Map */}
      <div className="relative h-[45vh] shrink-0">
        <MapContainer
          center={pos}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <FitBounds bounds={mapBounds} />
          <Marker position={[pharmacyLat, pharmacyLng]} icon={pharmacyIcon} />
          <Marker position={pos} icon={userIcon} />
          {!isDelivered && status !== 'pending' && (
            <Marker position={[riderLat, riderLng]} icon={riderIcon} />
          )}
          <Polyline
            positions={[[pharmacyLat, pharmacyLng], pos]}
            pathOptions={{ color: '#0FD452', weight: 3, dashArray: '8 8', opacity: 0.6 }}
          />
        </MapContainer>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 z-[1000]"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>

        {/* Pharmacy label */}
        <div className="absolute top-4 right-4 bg-white rounded-2xl px-3 py-2 shadow-md z-[1000] max-w-[180px]">
          <p className="text-[10px] text-gray-400 font-medium">From</p>
          <p className="text-xs font-bold text-gray-900 truncate">{pharmacy.pharmacy_name || 'Pharmacy'}</p>
        </div>

        {/* ETA pill */}
        {!isDelivered && !isCancelled && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#000F14] text-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg z-[1000]">
            <div className="w-2 h-2 bg-[#0FD452] rounded-full animate-pulse" />
            <span className="text-sm font-bold">~{etaMinutes} min</span>
            <span className="text-xs text-white/60">away</span>
          </div>
        )}
      </div>

      {/* Status + Details */}
      <div className="flex-1 overflow-y-auto -mt-4 relative z-[1001]">
        {/* Status card */}
        <div className="bg-white rounded-t-3xl px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
              <Package size={18} className="text-[#0FD452]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">#{order.order_code || order.id}</p>
              <p className="text-sm font-bold text-gray-900">{pharmacy.pharmacy_name || 'Pharmacy'}</p>
            </div>
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${
              isCancelled ? 'bg-red-50 text-red-500' :
              isDelivered ? 'bg-green-50 text-green-600' :
              'bg-[#0FD452]/10 text-[#0FD452]'
            }`}>
              {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered' : status.replace('_', ' ')}
            </span>
          </div>

          {/* Timeline steps */}
          {!isCancelled && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
              {steps.map((step, idx) => {
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-1 shrink-0">
                    <div className={`flex flex-col items-center gap-1 ${idx < steps.length - 1 ? 'min-w-[60px]' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        done ? 'bg-[#0FD452]' : 'bg-gray-100'
                      } ${isCurrent ? 'ring-4 ring-[#0FD452]/20' : ''}`}>
                        <step.icon size={14} className={done ? 'text-white' : 'text-gray-300'} />
                      </div>
                      <span className={`text-[9px] font-semibold text-center leading-tight ${
                        done ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-6 h-0.5 mt-[-14px] ${idx < currentIdx ? 'bg-[#0FD452]' : 'bg-gray-100'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 space-y-3">
          {/* Call pharmacy */}
          {(pharmacy.phone || pharmacy.user?.phone) && (
            <a
              href={`tel:${pharmacy.phone || pharmacy.user?.phone}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Phone size={16} className="text-[#0FD452]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Call Pharmacy</p>
                <p className="text-xs text-gray-400">{pharmacy.phone || pharmacy.user?.phone}</p>
              </div>
            </a>
          )}

          {/* Chat */}
          <button
            onClick={() => navigate(`/chat/${pharmacy.id}`)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageCircle size={16} className="text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Message Pharmacy</p>
              <p className="text-xs text-gray-400">Chat about your order</p>
            </div>
          </button>

          {/* View items */}
          <button
            onClick={() => setShowItemsSheet(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Package size={16} className="text-purple-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">View Items</p>
              <p className="text-xs text-gray-400">{order.items?.length || 0} items in this order</p>
            </div>
          </button>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <MapPin size={16} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium">Delivery Address</p>
                <p className="text-sm font-bold text-gray-900">Your location</p>
                <p className="text-[10px] text-gray-400">{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Order Total</span>
              <span className="text-lg font-bold text-gray-900">{Number(order.total || 0).toLocaleString('en-TZ')} <span className="text-xs font-medium text-gray-400">TZS</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Items bottom sheet */}
      {showItemsSheet && (
        <div className="fixed inset-0 z-[4000]" style={{ margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowItemsSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] max-h-[60vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Order Items</h3>
              <button onClick={() => setShowItemsSheet(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0FD452" strokeWidth="2"><path d="M12 2L12 22M2 12L22 12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.drug?.name || item.name || 'Drug'}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {(Number(item.unit_price || item.price || 0) * item.quantity).toLocaleString('en-TZ')} <span className="text-[10px] text-gray-400">TZS</span>
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-[#0FD452]">{Number(order.total || 0).toLocaleString('en-TZ')} TZS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
