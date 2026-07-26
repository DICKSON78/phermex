import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react';
import api from '../../services/api';
import BottomNav from '../../components/customer/BottomNav';

const statusConfig = {
  pending: { color: 'bg-amber-50 text-amber-600', label: 'Pending' },
  approved: { color: 'bg-green-50 text-green-600', label: 'Approved' },
  rejected: { color: 'bg-red-50 text-red-600', label: 'Rejected' },
  reviewed: { color: 'bg-blue-50 text-blue-600', label: 'Reviewed' },
};

export default function CustomerPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/customer-app/prescriptions')
      .then((res) => {
        const d = res.data;
        setPrescriptions(d.data?.data || d.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-8">
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">My Prescriptions</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={24} className="text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">No prescriptions</p>
            <p className="text-sm text-gray-400">Upload a prescription when placing an order</p>
          </div>
        ) : (
          prescriptions.map((rx) => {
            const status = statusConfig[rx.status] || { color: 'bg-gray-100 text-gray-500', label: rx.status || 'Pending' };
            return (
              <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Dr. {rx.doctor_name || 'N/A'}</p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{rx.hospital_name || 'N/A'}</p>
                    {rx.notes && <p className="text-xs text-gray-500 mt-2">{rx.notes}</p>}
                    <p className="text-[10px] text-gray-300 mt-2">{new Date(rx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
