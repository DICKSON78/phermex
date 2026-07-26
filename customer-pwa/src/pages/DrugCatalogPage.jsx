import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import DrugCard from '../components/DrugCard';

export default function DrugCatalogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [pharmacy, setPharmacy] = useState(null);
  const [cart, setCart] = useState({});

  useEffect(() => {
    api.get(`/pharmacies/${id}`).then((res) => setPharmacy(res.data.data || res.data)).catch(() => {});
    api.get(`/pharmacies/${id}/categories`).then((res) => setCategories(res.data.data || res.data || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    const params = { search };
    if (category) params.category = category;
    api.get(`/pharmacies/${id}/drugs`, { params }).then((res) => {
      setDrugs(res.data.data || res.data || []);
    }).catch(() => {});
  }, [id, search, category]);

  const toggleDrug = (drug) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[drug.id]) {
        delete next[drug.id];
      } else {
        next[drug.id] = { ...drug, quantity: 1 };
      }
      return next;
    });
  };

  const updateQty = (drugId, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[drugId]) return prev;
      const newQty = next[drugId].quantity + delta;
      if (newQty <= 0) {
        delete next[drugId];
      } else {
        next[drugId] = { ...next[drugId], quantity: newQty };
      }
      return next;
    });
  };

  const itemCount = Object.values(cart).reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-24">
      <div className="bg-white px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-[#000F14] truncate">{pharmacy?.name || 'Drugs'}</h1>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search drugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#f5f7f5] border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
              !category ? 'bg-[#0FD452] border-[#0FD452] text-[#000F14]' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setCategory(cat.slug || cat.name)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
                category === (cat.slug || cat.name)
                  ? 'bg-[#0FD452] border-[#0FD452] text-[#000F14]'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 space-y-3">
        {drugs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No drugs found.</p>
        ) : (
          drugs.map((drug) => {
            const inCart = cart[drug.id];
            return (
              <DrugCard
                key={drug.id}
                drug={drug}
                quantity={inCart?.quantity || 0}
                onAdd={() => {
                  if (inCart) updateQty(drug.id, 1);
                  else toggleDrug(drug);
                }}
                onRemove={() => updateQty(drug.id, -1)}
              />
            );
          })
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => {
              sessionStorage.setItem('pharmex_cart', JSON.stringify({ pharmacyId: id, items: Object.values(cart) }));
              navigate('/cart');
            }}
            className="w-full bg-[#0FD452] hover:bg-[#0cb843] text-[#000F14] rounded-xl font-bold text-sm py-3.5 flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingCart size={16} />
            View Cart ({itemCount})
          </button>
        </div>
      )}
    </div>
  );
}
