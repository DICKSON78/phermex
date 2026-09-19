import { useState, useEffect } from 'react'
import {
  Star,
  Loader2,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import api from '../../services/api'

function Stars({ rating }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0))
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

const PAGE_SIZE = 10

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/reviews?page=${pageNum}&per_page=${PAGE_SIZE}`)
      const d = res.data?.data || res.data
      const list = Array.isArray(d) ? d : (d.data || [])
      setReviews(list)
      setPage(pageNum)
      setLastPage(d.last_page || 1)
      setTotal(d.total || list.length)
    } catch {
      setReviews([])
      setLastPage(1)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
          <Star className="w-5 h-5 text-[#0FD452]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">All customer reviews across pharmacies.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Star className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No reviews yet</h3>
          <p className="text-sm text-gray-500">Customer reviews will appear here.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Pharmacy</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Customer</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Rating</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Review</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#0FD452]" />
                        <span>Date</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Building2 className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {r.pharmacy?.pharmacy_name || 'Unknown Pharmacy'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.user?.name || 'Anonymous'}</td>
                      <td className="px-6 py-4"><Stars rating={r.rating} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <span className="text-sm text-gray-600 max-w-xs">
                            {r.review || <span className="text-gray-400 italic">No written review</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <p className="text-sm text-gray-500">Total {total} reviews</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchReviews(page - 1)}
                    disabled={page === 1}
                    className="btn-ghost"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-500 px-2">{page} / {lastPage}</span>
                  <button
                    onClick={() => fetchReviews(page + 1)}
                    disabled={page === lastPage}
                    className="btn-ghost"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
