import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { toArray, toObject } from '../../utils/safeData'
import api from '../../services/api'
import {
  Star,
  MessageSquareQuote,
  Loader2,
  Store,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
} from 'lucide-react'

function Stars({ rating }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0))
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
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

export default function PharmacyReviewsPage() {
  const { pharmacyId } = useAuth()
  const [pharmacy, setPharmacy] = useState(null)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [toast, setToast] = useState(null)

  const loadReviews = async (pageNum = 1, pharmacy) => {
    try {
      const res = await api.get(`/pharmacies/${pharmacy.id}/reviews?page=${pageNum}&per_page=${PAGE_SIZE}`)
      const d = res.data?.data || res.data || {}
      const list = toArray(d.reviews)
      if (pageNum === 1) {
        setReviews(list)
      } else {
        setReviews((prev) => [...prev, ...list])
      }
      setRating(Number(d.rating) || 0)
      setTotalReviews(Number(d.total_reviews) || list.length)
      setHasMore((d.reviews?.current_page ?? pageNum) < (d.reviews?.last_page ?? pageNum))
      setPage(pageNum)
    } catch {
      setReviews([])
      setHasMore(false)
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    const load = async () => {
      try {
        let pharmacyObj = null
        if (pharmacyId) {
          const phRes = await api.get('/pharmacies/current')
          pharmacyObj = toObject(phRes.data, phRes.data)
        }
        if (!pharmacyObj) {
          const phRes = await api.get('/pharmacies')
          const list = toArray(phRes.data)
          pharmacyObj = list.find((p) => p.id === pharmacyId) || list[0] || null
        }
        if (!pharmacyObj) {
          if (active) setPharmacy(null)
          return
        }
        if (active) setPharmacy(pharmacyObj)
        await loadReviews(1, pharmacyObj)
      } catch {
        if (active) setPharmacy(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId])

  const loadMore = () => {
    if (!pharmacy) return
    loadReviews(page + 1, pharmacy)
  }

  const refresh = async () => {
    if (!pharmacy) return
    setLoading(true)
    await loadReviews(1, pharmacy)
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading && !pharmacy) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!pharmacy) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={24} className="text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">No pharmacy found</p>
          <p className="text-sm text-gray-400">
            Set up your pharmacy to start receiving customer reviews.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <MessageSquareQuote className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
            <p className="text-sm text-gray-500">
              {pharmacy.pharmacy_name || 'Your pharmacy'} &mdash; see what customers are saying.
            </p>
          </div>
        </div>
        <button onClick={refresh} className="btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{rating ? rating.toFixed(1) : '—'}</span>
          </div>
          <div>
            <Stars rating={rating} />
            <p className="text-sm text-gray-500 mt-1">
              {rating ? `${rating.toFixed(1)} out of 5` : 'No ratings yet'}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50">
          <MessageSquareQuote className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{totalReviews} total reviews</span>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={24} className="text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">No reviews yet</p>
          <p className="text-sm text-gray-400">Customer reviews will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#0FD452]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.user?.name || 'Anonymous Customer'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {review.review && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{review.review}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center pt-2">
          <button onClick={loadMore} className="btn-secondary">
            Load More
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#000F14] text-white'}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
