import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'

export default function DataTable({
  columns,
  data,
  searchable = true,
  pagination = true,
  pageSize = 10,
  onView,
  onEdit,
  onDelete,
  title,
}) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [activeMenu, setActiveMenu] = useState(null)

  const filteredData = useMemo(() => {
    let result = [...data]
    if (search) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key]
          return value && String(value).toLowerCase().includes(search.toLowerCase())
        })
      )
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [data, search, sortConfig, columns])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setActiveMenu(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-dark">{title}</h3>
        {searchable && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search..."
              className="bg-transparent text-sm text-dark placeholder-gray-400 outline-none w-48"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:text-dark select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-primary/5 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-dark whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                        className="p-1.5 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === index && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-6 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
                            {onView && (
                              <button
                                onClick={() => { onView(row); setActiveMenu(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => { onEdit(row); setActiveMenu(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => { onDelete(row); setActiveMenu(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-dark'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
