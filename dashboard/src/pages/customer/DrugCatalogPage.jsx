import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart, X, LayoutGrid, List } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import DrugCard from '../../components/customer/DrugCard';
import BottomNav from '../../components/customer/BottomNav';

export default function DrugCatalogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [pharmacy, setPharmacy] = useState(null);
  const [cart, setCart] = useState({});
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    api.get(`/customer-app/pharmacies/${id}`).then((res) => {
      const d = res.data;
      setPharmacy(d.data?.pharmacy || d.data || d);
    }).catch(() => {});
    api.get(`/customer-app/pharmacies/${id}/categories`).then((res) => setCategories(res.data.data || res.data || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    const params = { search: debouncedSearch };
    if (category) params.category = category;
    api.get(`/customer-app/pharmacies/${id}/drugs`, { params }).then((res) => {
      const d = res.data;
      setDrugs(d.data?.data || d.data || []);
    }).catch(() => {});
  }, [id, debouncedSearch, category]);

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
  const totalPrice = Object.values(cart).reduce((s, i) => s + (Number(i.selling_price || i.price) * i.quantity), 0);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{pharmacy?.pharmacy_name || 'Drugs'}</h1>
          </div>
          <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 active:scale-95 transition-transform">
            {viewMode === 'list' ? <LayoutGrid size={18} className="text-gray-500" /> : <List size={18} className="text-gray-500" />}
          </button>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search drugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border-0 rounded-2xl pl-11 pr-10 py-3 text-sm focus:ring-2 focus:ring-[#0FD452] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              !category ? 'bg-[#0FD452] text-[#000F14] shadow-sm shadow-[#0FD452]/20' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setCategory(cat.slug || cat.name)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                category === (cat.slug || cat.name)
                  ? 'bg-[#0FD452] text-[#000F14] shadow-sm shadow-[#0FD452]/20'
                  : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Drug list */}
      <div className="px-4 mt-3 space-y-3">
        {drugs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No drugs found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
          </div>
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

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[1000]">
          <button
            onClick={() => {
              sessionStorage.setItem('pharmex_cart', JSON.stringify({ pharmacyId: id, pharmacyName: pharmacy?.pharmacy_name || 'Pharmacy', items: Object.values(cart) }));
              navigate('/cart');
            }}
            className="w-full bg-[#000F14] hover:bg-[#0a1a1e] text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl shadow-black/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0FD452] rounded-xl flex items-center justify-center">
                <ShoppingCart size={18} className="text-[#000F14]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-gray-400">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
                <p className="text-sm font-bold">{Number(totalPrice).toLocaleString('en-TZ')} TZS</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#0FD452]">
              View Cart
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
