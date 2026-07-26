import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Plus, Search, Edit, Trash2, Tags, Package, X, Save,
} from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const CATEGORY_COLORS = [
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
]

export default function CategoryListPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/drug-categories')
      setCategories(toArray(res.data))
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  const totalDrugs = categories.reduce((sum, c) => sum + (c.drug_count || 0), 0)

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setEditingCategory(null)
    setShowForm(false)
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormDescription(cat.description || '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    const payload = { name: formName.trim(), description: formDescription.trim() }
    try {
      if (editingCategory) {
        await api.put(`/drug-categories/${editingCategory.id}`, payload)
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...payload } : c))
        )
      } else {
        const res = await api.post('/drug-categories', payload)
        const newCat = toArray(res.data) || { ...payload, id: Date.now(), drug_count: 0 }
        setCategories((prev) => [...prev, newCat])
      }
    } catch {
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...payload } : c))
        )
      } else {
        setCategories((prev) => [...prev, { ...payload, id: Date.now(), drug_count: 0 }])
      }
    }
    resetForm()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/drug-categories/${deleteTarget.id}`)
    } catch {}
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const getColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Tags className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500">Organize drugs into categories.</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Drugs</p>
          <p className="text-2xl font-bold text-gray-900">{totalDrugs}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg per Category</p>
          <p className="text-2xl font-bold text-gray-900">{categories.length > 0 ? (totalDrugs / categories.length).toFixed(1) : '0'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Empty Categories</p>
          <p className="text-2xl font-bold text-gray-900">{categories.filter(c => (c.drug_count || 0) === 0).length}</p>
        </div>
      </div>

      {/* Search + Add Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0FD452]/20 focus:border-[#0FD452] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Antibiotics"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0FD452] focus:ring-1 focus:ring-[#0FD452]/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 justify-end">
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={!formName.trim()} className="btn-primary">
              <Save className="w-4 h-4" />
              {editingCategory ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tags className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">No categories found</p>
          <p className="text-xs text-gray-400">{search ? 'Try a different search term' : 'Add your first category to get started'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((cat, idx) => {
            const color = getColor(idx)
            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl p-4 border border-gray-100 transition-all hover:border-[#0FD452]/30 hover:shadow-md group cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center shrink-0`}>
                    <Tags className={`w-5 h-5 ${color.text}`} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(cat) }}
                      className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat) }}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{cat.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">
                      {cat.drug_count || 0} drug{(cat.drug_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${(cat.drug_count || 0) > 0 ? 'bg-[#0FD452]' : 'bg-gray-200'}`} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  )
}
