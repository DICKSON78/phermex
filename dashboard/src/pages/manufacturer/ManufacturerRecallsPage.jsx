import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, AlertTriangle, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import {
  PageHeader,
  Modal,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  Badge,
  EmptyState,
  Spinner,
  formatDate,
} from './ManufacturerUI'

const REASONS = [
  ['defective', 'Defective product'],
  ['contamination', 'Contamination'],
  ['labeling', 'Labelling'],
  ['efficacy', 'Efficacy'],
  ['safety', 'Safety'],
]

const SEVERITIES = [
  ['class_i', 'Class I — serious'],
  ['class_ii', 'Class II — moderate'],
  ['class_iii', 'Class III — minor'],
]

export default function ManufacturerRecallsPage() {
  const navigate = useNavigate()
  const [recalls, setRecalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const [modal, setModal] = useState(null) // { type: 'delete', recall }
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/manufacturer-portal/recalls', {
        params: { search: search || undefined, status: status || undefined },
      })
      setRecalls(data.recalls || [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load recalls.')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const openCreate = () => navigate('/dashboard/manufacturer/recalls/new')
  const openEdit = (recall) => navigate(`/dashboard/manufacturer/recalls/${recall.id}/edit`)

  const closeModal = () => {
    if (deleting) return
    setModal(null)
  }

  const confirmDelete = async () => {
    if (!modal?.recall) return
    setDeleting(true)
    try {
      await api.delete(`/manufacturer-portal/recalls/${modal.recall.id}`)
      toast.success('Recall deleted.')
      setModal(null)
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not delete the recall.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Drug recalls"
        subtitle="Report and track recalls for the products you manufacture."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Report recall
          </PrimaryButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, recall number or batch…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} sm:w-48`}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : recalls.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No recalls recorded"
          message="When a batch needs to be pulled, record it here so the affected quantity and status stay traceable."
          action={<PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Report recall</PrimaryButton>}
        />
      ) : (
        <div className="space-y-3">
          {recalls.map((recall) => (
            <div key={recall.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#000F14]">{recall.product_name}</p>
                    <p className="text-xs text-gray-400">
                      {recall.recall_number} · {REASONS.find(([v]) => v === recall.recall_reason)?.[1] || recall.recall_reason}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={recall.status === 'completed' ? 'green' : recall.status === 'pending' ? 'amber' : 'blue'}>
                        {String(recall.status).replace('_', ' ')}
                      </Badge>
                      <Badge tone={recall.severity === 'class_i' ? 'red' : recall.severity === 'class_ii' ? 'amber' : 'gray'}>
                        {SEVERITIES.find(([v]) => v === recall.severity)?.[1] || recall.severity}
                      </Badge>
                      {recall.batch_numbers && <span className="text-xs text-gray-500">Batch: {recall.batch_numbers}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <div className="text-xs text-gray-500">
                    Issued {formatDate(recall.date_issued)}
                  </div>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => openEdit(recall)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setModal({ type: 'delete', recall })} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-50 pt-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Affected</p>
                  <p className="font-semibold text-[#000F14]">{recall.affected_quantity ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Returned</p>
                  <p className="font-semibold text-[#000F14]">{recall.returned_quantity ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Resolved</p>
                  <p className="font-semibold text-[#000F14]">{formatDate(recall.date_resolved)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Linked product</p>
                  <p className="font-semibold text-[#000F14]">{recall.product?.name || '—'}</p>
                </div>
              </div>

              {recall.notes && <p className="mt-3 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-600">{recall.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal?.type === 'delete'}
        onClose={closeModal}
        title="Delete recall"
        footer={
          <>
            <SecondaryButton onClick={closeModal} disabled={deleting}>Cancel</SecondaryButton>
            <DangerButton onClick={confirmDelete} loading={deleting}><Trash2 className="h-4 w-4" /> Delete</DangerButton>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Delete recall <strong className="text-[#000F14]">{modal?.recall?.recall_number}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
