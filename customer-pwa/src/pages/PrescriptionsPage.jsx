import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import api from '../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  reviewed: 'bg-blue-100 text-blue-700',
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-8">
      <div className="bg-white px-4 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-[#000F14]">My Prescriptions</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#0FD452] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">No prescriptions uploaded yet</p>
          </div>
        ) : (
          prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#000F14]">Dr. {rx.doctor_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{rx.hospital_name || 'N/A'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[rx.status] || 'bg-gray-100 text-gray-500'}`}>
                  {rx.status || 'pending'}
                </span>
              </div>
              {rx.notes && <p className="text-xs text-gray-500 mt-2">{rx.notes}</p>}
              <p className="text-[10px] text-gray-400 mt-2">{new Date(rx.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
