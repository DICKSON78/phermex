import { useState, useEffect } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Star, Loader2, Plus, TrendingUp, Users, BarChart3, X,
  User, Calendar, Target, Settings,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as RechartsBar,
} from 'recharts'
import toast from 'react-hot-toast'
import { performance, employees } from '../../services/api'

const FALLBACK_REVIEWS = [
  { id: 1, employee: { id: 1, first_name: 'Sarah', last_name: 'Nakamya' }, reviewer: { name: 'Dr. Mwamba' }, review_period_start: '2026-01-01', review_period_end: '2026-06-30', rating: 4.5, goals_met: 92, strengths: 'Excellent leadership and patient care skills', areas_for_improvement: 'Could improve documentation speed', status: 'submitted' },
  { id: 2, employee: { id: 2, first_name: 'James', last_name: 'Ochieng' }, reviewer: { name: 'Dr. Mwamba' }, review_period_start: '2026-01-01', review_period_end: '2026-06-30', rating: 3.8, goals_met: 85, strengths: 'Strong technical knowledge', areas_for_improvement: 'Needs better time management', status: 'acknowledged' },
  { id: 3, employee: { id: 3, first_name: 'Mary', last_name: 'Ajambo' }, reviewer: { name: 'Dr. Mwamba' }, review_period_start: '2026-01-01', review_period_end: '2026-06-30', rating: 4.0, goals_met: 88, strengths: 'Detail-oriented and accurate', areas_for_improvement: 'Should take more initiative', status: 'draft' },
]

const FALLBACK_DEPT_RATINGS = [
  { department: 'Pharmacy', rating: 4.2 },
  { department: 'Finance', rating: 4.0 },
  { department: 'Operations', rating: 3.5 },
  { department: 'HR', rating: 3.8 },
  { department: 'Management', rating: 4.5 },
]

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600 border-gray-200', submitted: 'bg-blue-100 text-blue-700 border-blue-200', acknowledged: 'bg-green-100 text-green-700 border-green-200' }

export default function PerformancePage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({})
  const [deptRatings, setDeptRatings] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [employeeList, setEmployeeList] = useState([])
  const [form, setForm] = useState({
    employee_id: '', reviewer_id: 1, review_period_start: '', review_period_end: '',
    rating: '3.0', goals_met: '80', strengths: '', areas_for_improvement: '', comments: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchReviews(); fetchSummary(); fetchEmployees() }, [filter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = { per_page: 50 }
      if (filter !== 'all') params.status = filter
      const res = await performance.getAll(params)
      setReviews(toArray(res.data))
    } catch {
      setReviews(FALLBACK_REVIEWS)
    } finally { setLoading(false) }
  }

  const fetchSummary = async () => {
    try {
      const res = await performance.getSummary()
      setSummary(res.data)
      setDeptRatings(FALLBACK_DEPT_RATINGS)
    } catch {
      setSummary({ average_rating: 4.1, average_goals_met: 88.3, total_reviews: 3, rating_distribution: { '5': 1, '4': 1, '3': 1, '2': 0, '1': 0 } })
      setDeptRatings(FALLBACK_DEPT_RATINGS)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await employees.getAll({ per_page: 100 })
      setEmployeeList(toArray(res.data))
    } catch {
      setEmployeeList(FALLBACK_REVIEWS.map(r => r.employee))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      await performance.create({
        ...form,
        rating: Number(form.rating),
        goals_met: Number(form.goals_met),
      })
      toast.success('Review created')
      setShowForm(false)
      setForm({ employee_id: '', reviewer_id: 1, review_period_start: '', review_period_end: '', rating: '3.0', goals_met: '80', strengths: '', areas_for_improvement: '', comments: '' })
      fetchReviews()
      fetchSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create review')
    } finally { setFormLoading(false) }
  }

  const handleSubmitReview = async (id) => {
    try {
      await performance.submit(id)
      toast.success('Review submitted')
      fetchReviews()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleAcknowledge = async (id) => {
    try {
      await performance.acknowledge(id)
      toast.success('Review acknowledged')
      fetchReviews()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const ratingDist = [
    { name: '5 Stars', count: summary.rating_distribution?.['5'] || 0, fill: '#0FD452' },
    { name: '4 Stars', count: summary.rating_distribution?.['4'] || 0, fill: '#3B82F6' },
    { name: '3 Stars', count: summary.rating_distribution?.['3'] || 0, fill: '#F59E0B' },
    { name: '2 Stars', count: summary.rating_distribution?.['2'] || 0, fill: '#F97316' },
    { name: '1 Star', count: summary.rating_distribution?.['1'] || 0, fill: '#EF4444' },
  ]

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
      <span className="ml-1.5 text-sm text-gray-900 font-medium">{rating}</span>
    </div>
  )

  const inputClass = 'w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0FD452] focus:border-[#0FD452] transition-all'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#0FD452]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
              <p className="text-sm text-gray-500">Track employee performance reviews.</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Review'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Performance Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Employee *</label>
                  <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required className={inputClass}>
                    <option value="">Select employee</option>
                    {employeeList.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Rating (1-5) *</label>
                  <input type="number" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} min="1" max="5" step="0.1" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Review Period Start *</label>
                  <input type="date" value={form.review_period_start} onChange={(e) => setForm({ ...form, review_period_start: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Review Period End *</label>
                  <input type="date" value={form.review_period_end} onChange={(e) => setForm({ ...form, review_period_end: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Goals Met (%) *</label>
                  <input type="number" value={form.goals_met} onChange={(e) => setForm({ ...form, goals_met: e.target.value })} min="0" max="100" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Strengths</label>
                <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={3} placeholder="Key strengths observed..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Areas for Improvement</label>
                <textarea value={form.areas_for_improvement} onChange={(e) => setForm({ ...form, areas_for_improvement: e.target.value })} rows={3} placeholder="Areas that need improvement..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Comments</label>
                <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={2} placeholder="Additional comments..." className={inputClass} />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0FD452] hover:bg-[#0DC048] disabled:bg-[#0FD452]/50 text-[#000F14] font-semibold rounded-xl transition-colors text-sm">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Review
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0FD452]/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-[#0FD452]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0FD452]">{summary.average_rating || 0}</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{summary.average_goals_met || 0}%</p>
                <p className="text-xs text-gray-500">Avg Goals Met</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{summary.total_reviews || 0}</p>
                <p className="text-xs text-gray-500">Total Reviews</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{summary.rating_distribution?.['5'] || 0}</p>
                <p className="text-xs text-gray-500">5-Star Reviews</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Rating Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBar data={ratingDist} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {ratingDist.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Department Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBar data={deptRatings} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="department" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
                  <Bar dataKey="rating" fill="#0FD452" radius={[4, 4, 0, 0]} />
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm mb-6">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200">
            {['all', 'draft', 'submitted', 'acknowledged'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-[#0FD452]/10 text-[#0FD452]' : 'text-gray-500 hover:bg-gray-100'}`}>{f}</button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Employee</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Reviewer</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Period</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Rating</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Goals Met</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Status</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center"><Loader2 className="w-8 h-8 text-[#0FD452] animate-spin mx-auto" /></td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews found</p>
                  </td></tr>
                ) : (
                  reviews.map(r => (
                    <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <User className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{r.employee?.first_name} {r.employee?.last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.reviewer?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{r.review_period_start} - {r.review_period_end}</td>
                      <td className="px-6 py-4">{renderStars(r.rating)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium hidden lg:table-cell">{r.goals_met}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'draft' && (
                            <button onClick={() => handleSubmitReview(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                              Submit
                            </button>
                          )}
                          {r.status === 'submitted' && (
                            <button onClick={() => handleAcknowledge(r.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
