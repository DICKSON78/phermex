import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderId = state?.orderId;
  const orderCode = state?.code || 'N/A';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <CheckCircle size={72} className="text-[#0FD452] mb-4" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-[#000F14] mb-1">Order Placed Successfully</h1>
        <p className="text-sm text-gray-400">Order code: <span className="font-semibold text-[#000F14]">{orderCode}</span></p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {orderId && (
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3.5 flex items-center justify-center gap-2"
          >
            Track Order <ArrowRight size={16} />
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="border border-gray-200 text-gray-600 rounded-xl font-bold text-sm py-3.5 flex items-center justify-center gap-2"
        >
          <Home size={16} /> Back to Home
        </button>
      </div>
    </div>
  );
}
