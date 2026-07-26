import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Plus, Search, ChevronRight, ChevronDown, Edit, Trash2,
  DollarSign, Filter, X, Layers, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const ACCOUNT_TYPES = [
  { id: 'asset', label: 'Assets', color: 'blue' },
  { id: 'liability', label: 'Liabilities', color: 'red' },
  { id: 'equity', label: 'Equity', color: 'purple' },
  { id: 'revenue', label: 'Revenue', color: 'green' },
  { id: 'expense', label: 'Expenses', color: 'orange' },
]

const TYPE_COLORS = {
  asset: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', border: 'border-blue-500/20' },
  liability: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', border: 'border-red-500/20' },
  equity: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300', border: 'border-purple-500/20' },
  revenue: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300', border: 'border-green-500/20' },
  expense: { bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', border: 'border-orange-500/20' },
}

const FALLBACK_ACCOUNTS = [
  { id: 1, account_code: '1000', account_name: 'Cash', account_type: 'asset', balance: 25430.50, is_active: true, children: [
    { id: 2, account_code: '1010', account_name: 'Petty Cash', account_type: 'asset', balance: 500.00, is_active: true, children: [] },
  ]},
  { id: 3, account_code: '1100', account_name: 'Accounts Receivable', account_type: 'asset', balance: 12800.00, is_active: true, children: [] },
  { id: 4, account_code: '1200', account_name: 'Inventory', account_type: 'asset', balance: 45200.00, is_active: true, children: [] },
  { id: 5, account_code: '2000', account_name: 'Accounts Payable', account_type: 'liability', balance: -8500.00, is_active: true, children: [] },
  { id: 6, account_code: '2100', account_name: 'Loan Payable', account_type: 'liability', balance: -50000.00, is_active: true, children: [] },
  { id: 7, account_code: '3000', account_name: 'Owner Equity', account_type: 'equity', balance: -75000.00, is_active: true, children: [] },
  { id: 8, account_code: '4000', account_name: 'Sales Revenue', account_type: 'revenue', balance: -128500.00, is_active: true, children: [] },
  { id: 9, account_code: '4100', account_name: 'Service Revenue', account_type: 'revenue', balance: -15200.00, is_active: true, children: [] },
  { id: 10, account_code: '5000', account_name: 'Cost of Goods Sold', account_type: 'expense', balance: 78400.00, is_active: true, children: [] },
  { id: 11, account_code: '5100', account_name: 'Rent Expense', account_type: 'expense', balance: 12000.00, is_active: true, children: [] },
  { id: 12, account_code: '5200', account_name: 'Salary Expense', account_type: 'expense', balance: 36000.00, is_active: true, children: [] },
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(Math.abs(amount))
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
        className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-700/30 transition-colors border-b border-gray-700/30`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <span className="font-mono text-xs text-gray-400 w-16">{account.account_code}</span>
        <span className="flex-1 text-sm text-white font-medium">{account.account_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colors.badge}`}>
          {account.account_type}
        </span>
        
        <span className={`text-sm font-mono tabular-nums w-32 text-right ${isDebitNormal ? 'text-white' : 'text-green-400'}`}>
          {formatCurrency(balance)}
        </span>
        
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => onEdit(account)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(account)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
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
  const [accounts, setAccounts] = useState([])
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [balances, setBalances] = useState(null)
  const [formData, setFormData] = useState({
    account_code: '', account_name: '', account_type: 'asset', parent_id: '', description: '', currency: 'TZS',
  })
  const [saving, setSaving] = useState(false)

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
      const flatRes = await api.get('/accounts', { params: { per_page: 200 } })
      setAccounts(flatRes.data.data || [])
    } catch {
      setTree(buildTree(FALLBACK_ACCOUNTS))
      setAccounts(FALLBACK_ACCOUNTS)
      setBalances({ total_debit: 163900.50, total_credit: 163900.50, is_balanced: true })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...formData }
      if (payload.parent_id === '') delete payload.parent_id
      if (editAccount) {
        await api.put(`/accounts/${editAccount.id}`, payload)
        toast.success('Account updated')
      } else {
        await api.post('/accounts', payload)
        toast.success('Account created')
      }
      setShowForm(false)
      setEditAccount(null)
      resetForm()
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (account) => {
    setEditAccount(account)
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      parent_id: account.parent_id || '',
      description: account.description || '',
      currency: account.currency || 'TZS',
    })
    setShowForm(true)
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

  const resetForm = () => {
    setFormData({ account_code: '', account_name: '', account_type: 'asset', parent_id: '', description: '', currency: 'TZS' })
  }

  const openNewForm = () => {
    setEditAccount(null)
    resetForm()
    setShowForm(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
            <p className="text-sm text-gray-400 mt-1">Manage the accounting ledger structure.</p>
          </div>
        </div>
        <button onClick={openNewForm} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {balances && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4 ${!balances.is_balanced ? 'border-red-500/50' : ''}`}>
            <p className="text-xs text-gray-400 mb-1">Total Debit</p>
            <p className="text-lg font-bold text-white font-mono tabular-nums">{formatCurrency(balances.total_debit)}</p>
          </div>
          <div className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4 ${!balances.is_balanced ? 'border-red-500/50' : ''}`}>
            <p className="text-xs text-gray-400 mb-1">Total Credit</p>
            <p className="text-lg font-bold text-white font-mono tabular-nums">{formatCurrency(balances.total_credit)}</p>
          </div>
          {ACCOUNT_TYPES.map((t) => (
            <div key={t.id} className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{t.label}</p>
              <p className={`text-lg font-bold font-mono tabular-nums ${TYPE_COLORS[t.id].text}`}>{formatCurrency(totalByType[t.id])}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setActiveType('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeType === 'all' ? 'bg-[#0FD452] text-[#000F14]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          All
        </button>
        {ACCOUNT_TYPES.map((t) => (
          <button key={t.id} onClick={() => setActiveType(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${activeType === t.id ? `${TYPE_COLORS[t.id].bg} ${TYPE_COLORS[t.id].text}` : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            <div className={`w-2 h-2 rounded-full bg-current`} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50">
          <div className="flex-1 flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full" />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-700/20 flex items-center text-xs text-gray-400 font-medium">
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
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No accounts found</p>
          </div>
        ) : (
          filteredTree.map((account) => (
            <AccountTreeItem key={account.id} account={account} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1A24] border border-gray-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-white">{editAccount ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => { setShowForm(false); setEditAccount(null) }} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Code</label>
                  <input type="text" value={formData.account_code} onChange={(e) => setFormData({ ...formData, account_code: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#0FD452] transition-colors" placeholder="e.g. 1000" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Type</label>
                  <select value={formData.account_type} onChange={(e) => setFormData({ ...formData, account_type: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0FD452] transition-colors">
                    {ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Name</label>
                <input type="text" value={formData.account_name} onChange={(e) => setFormData({ ...formData, account_name: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#0FD452] transition-colors" placeholder="e.g. Cash in Hand" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Parent Account</label>
                <select value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0FD452] transition-colors">
                  <option value="">None (Top Level)</option>
                  {accounts.filter((a) => a.id !== editAccount?.id).map((a) => (
                    <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#0FD452] transition-colors resize-none" rows={2} placeholder="Optional description" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditAccount(null) }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
