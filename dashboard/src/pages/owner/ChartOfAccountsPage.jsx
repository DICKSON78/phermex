import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Search, ChevronRight, ChevronDown, Edit, Trash2,
  X, ArrowUpRight, ArrowDownRight, Loader2, Landmark, CreditCard, Scale, TrendingUp, Receipt, Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'

const ACCOUNT_TYPES = [
  { id: 'asset', label: 'Assets', color: 'blue' },
  { id: 'liability', label: 'Liabilities', color: 'red' },
  { id: 'equity', label: 'Equity', color: 'purple' },
  { id: 'revenue', label: 'Revenue', color: 'green' },
  { id: 'expense', label: 'Expenses', color: 'orange' },
]

const TYPE_COLORS = {
  asset: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  liability: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700', border: 'border-red-200' },
  equity: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  revenue: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100 text-green-700', border: 'border-green-200' },
  expense: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
}


function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2, abs: true })
}

const TYPE_ICONS = {
  asset: { Icon: Landmark, bg: 'bg-blue-100', text: 'text-blue-600' },
  liability: { Icon: CreditCard, bg: 'bg-red-100', text: 'text-red-600' },
  equity: { Icon: Scale, bg: 'bg-purple-100', text: 'text-purple-600' },
  revenue: { Icon: TrendingUp, bg: 'bg-green-100', text: 'text-green-600' },
  expense: { Icon: Receipt, bg: 'bg-orange-100', text: 'text-orange-600' },
}

function AccountTreeItem({ account, depth = 0, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = account.children && account.children.length > 0
  const colors = TYPE_COLORS[account.account_type] || TYPE_COLORS.asset
  const balance = Math.abs(account.balance || 0)
  const isDebitNormal = ['asset', 'expense'].includes(account.account_type)

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-700">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <span className=" text-xs text-gray-400 w-16">{account.account_code}</span>
        <span className="flex-1 text-sm text-gray-900 font-medium">{account.account_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colors.badge}`}>
          {account.account_type}
        </span>
        
        <span className={`text-sm  tabular-nums w-32 text-right ${isDebitNormal ? 'text-gray-900' : 'text-green-600'}`}>
          {formatCurrency(balance)}
        </span>
        
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => onEdit(account)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(account)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && hasChildren && account.children.map((child) => (
        <AccountTreeItem key={child.id} account={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

export default function ChartOfAccountsPage() {
  const navigate = useNavigate()
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [balances, setBalances] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [treeRes, balRes] = await Promise.all([
        api.get('/accounts/tree'),
        api.get('/accounts/balances'),
      ])
      setTree(treeRes.data.tree || [])
      setBalances(balRes.data)
    } catch {
      setTree([])
      setBalances(null)
    } finally {
      setLoading(false)
    }
  }

  const buildTree = (list, parentId = null) => {
    return list
      .filter((a) => a.parent_id === parentId)
      .map((a) => ({ ...a, children: buildTree(list, a.id) }))
  }

  const filteredTree = useMemo(() => {
    if (activeType === 'all' && !search) return tree
    const filterNodes = (nodes) => {
      return nodes.filter((node) => {
        const matchType = activeType === 'all' || node.account_type === activeType
        const matchSearch = !search ||
          node.account_name.toLowerCase().includes(search.toLowerCase()) ||
          node.account_code.toLowerCase().includes(search.toLowerCase())
        const childMatch = node.children && filterNodes(node.children).length > 0
        return (matchType && matchSearch) || childMatch
      }).map((node) => ({
        ...node,
        children: node.children ? filterNodes(node.children) : [],
      }))
    }
    return filterNodes(tree)
  }, [tree, activeType, search])

  const totalByType = useMemo(() => {
    const totals = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 }
    const sumType = (nodes) => {
      nodes.forEach((n) => {
        totals[n.account_type] += Math.abs(n.balance || 0)
        if (n.children) sumType(n.children)
      })
    }
    sumType(tree)
    return totals
  }, [tree])

  const handleEdit = (account) => {
    navigate(`/dashboard/chart-of-accounts/${account.id}/edit`)
  }

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.account_name}"?`)) return
    try {
      await api.delete(`/accounts/${account.id}`)
      toast.success('Account deleted')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Chart of Accounts"
        subtitle="Manage the accounting ledger structure."
        actions={
          <button onClick={() => navigate('/dashboard/chart-of-accounts/new')} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        }
      />

      {balances && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className={`bg-white border border-gray-200 rounded-xl p-4 ${!balances.is_balanced ? 'border-red-300' : ''}`}>
            <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><ArrowDownRight className="w-4 h-4 text-red-600" /></div></div>
            <p className="text-xs text-gray-500 mb-1">Total Debit</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(balances.total_debit)}</p>
          </div>
          <div className={`bg-white border border-gray-200 rounded-xl p-4 ${!balances.is_balanced ? 'border-red-300' : ''}`}>
            <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-blue-600" /></div></div>
            <p className="text-xs text-gray-500 mb-1">Total Credit</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(balances.total_credit)}</p>
          </div>
          {ACCOUNT_TYPES.map((t) => {
            const typeIcon = TYPE_ICONS[t.id] || { Icon: Wallet, bg: 'bg-gray-100', text: 'text-gray-600' }
            const Icon = typeIcon.Icon
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 ${typeIcon.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${typeIcon.text}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">{t.label}</p>
                <p className={`text-lg font-bold tabular-nums ${TYPE_COLORS[t.id].text}`}>{formatCurrency(totalByType[t.id])}</p>
              </div>
            )
          })}
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          ...ACCOUNT_TYPES.map((t) => ({ id: t.id, label: t.label })),
        ]}
        active={activeType}
        onChange={setActiveType}
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none w-full" />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-50 flex items-center text-xs text-gray-500 font-medium border-b border-gray-100">
          <div className="w-4 mx-2" />
          <div className="w-16">Code</div>
          <div className="flex-1">Account Name</div>
          <div className="w-20">Type</div>
          <div className="w-32 text-right">Balance</div>
          <div className="w-16 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0FD452] animate-spin" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No accounts found</p>
          </div>
        ) : (
          filteredTree.map((account) => (
            <AccountTreeItem key={account.id} account={account} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </div>


    </div>
  )
}