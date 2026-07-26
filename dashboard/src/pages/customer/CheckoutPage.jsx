import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Package, Navigation } from 'lucide-react';
import BottomNav from '../../components/customer/BottomNav';

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderId = state?.orderId;
  const orderCode = state?.code || 'N/A';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-20">
      <div className="flex flex-col items-center mb-10 fade-in-up">
        <div className="w-24 h-24 bg-[#0FD452]/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-[#0FD452]" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Placed!</h1>
        <p className="text-sm text-gray-400">Your order has been confirmed</p>
        <div className="mt-4 bg-gray-50 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Package size={16} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-900">#{orderCode}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs fade-in-up-d2">
        {orderId && (
          <button
            onClick={() => navigate(`/orders/${orderId}/track`)}
            className="bg-[#000F14] text-white rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <Navigation size={16} />
            Track Delivery
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-2xl font-bold text-sm py-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-sm shadow-[#0FD452]/20"
        >
          <Home size={16} /> Back to Home
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
