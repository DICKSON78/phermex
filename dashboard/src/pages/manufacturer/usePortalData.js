import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export function defaultRange() {
  const to = new Date()
  const from = new Date(to.getFullYear(), to.getMonth() - 5, 1)
  const format = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return { from: format(from), to: format(to) }
}

export function usePortalData(url, params = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = JSON.stringify(params)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: payload } = await api.get(url, { params: JSON.parse(query) })
      setData(payload)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Could not load this module.')
    } finally {
      setLoading(false)
    }
  }, [url, query])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}

export function usePortalList(url, params = {}) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = JSON.stringify(params)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(url, { params: JSON.parse(query) })
      setItems(data.items || data.products || data.inventory || data.recalls || data.tickets || [])
      setMeta(data.meta || data.summary || {})
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Could not load this list.')
    } finally {
      setLoading(false)
    }
  }, [url, query])

  useEffect(() => {
    load()
  }, [load])

  return { items, meta, loading, error, reload: load }
}

export async function downloadCsv(path, filename, params = {}) {
  try {
    const response = await api.get(path, { params, responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success('Export downloaded.')
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Could not download the export.')
  }
}
