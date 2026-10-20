import { useState, useEffect, useMemo } from 'react'
import { toArray } from '../../utils/safeData';
import {
  Building2, Plus, Search, ArrowLeftRight, CheckCircle, Eye,
  Loader2, X, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Landmark,
  Calendar, FileText, DollarSign,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { formatMoney } from '../../utils/currency'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'
import { useLanguage } from '../../contexts/LanguageContext'

const PIE_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']


function formatCurrency(amount) {
  return formatMoney(amount, { decimals: 2, abs: true })
}

const TX_TYPES = { deposit: { label: 'Deposit', icon: ArrowDownRight, color: 'text-green-600' }, withdrawal: { label: 'Withdrawal', icon: ArrowUpRight, color: 'text-red-600' }, transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' }, reconciliation: { label: 'Reconciliation', icon: RefreshCw, color: 'text-purple-600' } }

export default function BankManagementPage() {
  const { t } = useLanguage()
  const [bankAccounts, setBankAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showReconcile, setShowReconcile] = useState(false)
  const [txFilter, setTxFilter] = useState('all')
  const [summary, setSummary] = useState(null)
  const [formData, setFormData] = useState({ bank_name: '', account_name: '', account_number: '', swift_code: '', opening_balance: '' })
  const [transferData, setTransferData] = useState({ from_bank_account_id: '', to_bank_account_id: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] })
  const [selectedTx, setSelectedTx] = useState([])
  const [processing, setProcessing] = useState(false)

  const txTypeLabels = {
    deposit: t('accounting.bank.typeDeposit'),
    withdrawal: t('accounting.bank.typeWithdrawal'),
    transfer: t('accounting.bank.typeTransfer'),
    reconciliation: t('accounting.bank.typeReconciliation'),
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [accRes, sumRes] = await Promise.all([api.get('/bank'), api.get('/bank/summary')])
      setBankAccounts(accRes.data.accounts || [])
      setSummary(sumRes.data)
      if (accRes.data.accounts?.length > 0) {
        setSelectedAccount(accRes.data.accounts[0])
        const txRes = await api.get(`/bank/${accRes.data.accounts[0].id}/transactions`)
        setTransactions(txRes.data.data || [])
      }
    } catch {
      setBankAccounts([])
      setTransactions([])
      setSelectedAccount(null)
      setSummary(null)
    } finally { setLoading(false) }
  }

  const selectAccount = async (account) => {
    setSelectedAccount(account)
    setSelectedTx([])
    try {
      const res = await api.get(`/bank/${account.id}/transactions`)
      setTransactions(toArray(res.data))
    } catch { setTransactions([]) }
  }

  const filteredTx = useMemo(() => {
    if (txFilter === 'all') return transactions
    if (txFilter === 'reconciled') return transactions.filter((t) => t.reconciled)
    if (txFilter === 'unreconciled') return transactions.filter((t) => !t.reconciled)
    return transactions.filter((t) => t.type === txFilter)
  }, [transactions, txFilter])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setProcessing(true)
    try {
      await api.post('/bank', { ...formData, opening_balance: parseFloat(formData.opening_balance) || 0 })
      toast.success(t('accounting.bank.created'))
      setShowForm(false)
      setFormData({ bank_name: '', account_name: '', account_number: '', swift_code: '', opening_balance: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || t('accounting.bank.createFailed')) }
    finally { setProcessing(false) }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setProcessing(true)
    try {
      await api.post('/bank/transfer', { ...transferData, amount: parseFloat(transferData.amount) })
      toast.success(t('accounting.transfer.completed'))
      setShowTransfer(false)
      setTransferData({ from_bank_account_id: '', to_bank_account_id: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || t('accounting.transfer.failed')) }
    finally { setProcessing(false) }
  }

  const toggleTxSelect = (id) => setSelectedTx((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])

  const handleReconcile = async () => {
    if (!selectedAccount || selectedTx.length === 0) return
    setProcessing(true)
    try {
      await api.post(`/bank/${selectedAccount.id}/reconcile`, { transaction_ids: selectedTx })
      toast.success(`${selectedTx.length} ${t('accounting.bank.reconciledCount')}`)
      setShowReconcile(false)
      setSelectedTx([])
      selectAccount(selectedAccount)
    } catch (err) { toast.error(err.response?.data?.message || t('accounting.ui.failed')) }
    finally { setProcessing(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={Landmark}
        title={t('nav.items.bankManagement')}
        subtitle={t('accounting.bank.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTransfer(true)} className="btn-secondary">
              <ArrowLeftRight className="w-4 h-4" /> {t('accounting.transfer.transferBtn')}
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> {t('accounting.addAccount')}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((account) => (
          <div key={account.id} onClick={() => selectAccount(account)} className={`bg-white shadow-sm border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${selectedAccount?.id === account.id ? 'border-[#0FD452]/50 shadow-[#0FD452]/10' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#0FD452]/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0FD452]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{account.bank_name}</p>
                  <p className="text-xs text-gray-500">{account.account_name}</p>
                </div>
              </div>
              {account.is_default && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0FD452]/20 text-[#0FD452]">{t('accounting.bank.defaultBadge')}</span>}
            </div>
            <p className="text-xs text-gray-500 mb-1">{t('accounting.bank.accountLabel')} {account.account_number}</p>
            <p className="text-2xl font-bold text-gray-900  tabular-nums">{formatCurrency(account.current_balance)}</p>
          </div>
        ))}
      </div>

      {selectedAccount && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 pt-4 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedAccount.bank_name} - {t('accounting.bank.transactions')}</h2>
              <p className="text-xs text-gray-500">{t('accounting.ui.balance')}: {formatCurrency(selectedAccount.current_balance)}</p>
            </div>
            <button onClick={() => { setShowReconcile(true); setSelectedTx([]) }} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> {t('accounting.bank.reconcileBtn')}
            </button>
          </div>
          <Tabs
            tabs={[
              { id: 'all', label: t('common.all'), count: transactions.length },
              { id: 'deposit', label: t('accounting.bank.tabDeposits'), count: transactions.filter((t) => t.type === 'deposit').length },
              { id: 'withdrawal', label: t('accounting.bank.tabWithdrawals'), count: transactions.filter((t) => t.type === 'withdrawal').length },
              { id: 'transfer', label: t('accounting.bank.tabTransfers'), count: transactions.filter((t) => t.type === 'transfer').length },
              { id: 'reconciled', label: t('accounting.bank.tabReconciled'), count: transactions.filter((t) => t.reconciled).length },
              { id: 'unreconciled', label: t('accounting.bank.tabUnreconciled'), count: transactions.filter((t) => !t.reconciled).length },
            ]}
            active={txFilter}
            onChange={setTxFilter}
            className="px-6 mb-0"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-10" />
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.date')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('accounting.ui.type')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.description')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('orders.amount')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-end gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('accounting.ui.balance')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-[#0FD452]" />
                      <span>{t('common.status')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTx.map((tx) => {
                  const typeInfo = TX_TYPES[tx.type] || TX_TYPES.deposit
                  const Icon = typeInfo.icon
                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-[#0FD452]/5">
                      <td className="px-6 py-4">
                        {showReconcile && !tx.reconciled && (
                          <input type="checkbox" checked={selectedTx.includes(tx.id)} onChange={() => toggleTxSelect(tx.id)} className="rounded border-gray-300 bg-white text-[#0FD452] focus:ring-[#0FD452]" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                            <Calendar className="h-4 w-4 text-[#0FD452]" />
                          </div>
                          <span className="text-sm text-gray-900">{tx.transaction_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 ${typeInfo.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium capitalize">{txTypeLabels[tx.type] || tx.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tx.description}</td>
                      <td className={`px-6 py-4 text-sm  tabular-nums text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm  tabular-nums text-right text-gray-900">{formatCurrency(tx.balance_after)}</td>
                      <td className="px-6 py-4 text-center">
                        {tx.reconciled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">{t('accounting.bank.tabReconciled')}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">{t('common.pending')}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredTx.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">{t('accounting.bank.noTransactions')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('accounting.bank.addModalTitle')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.bank.bankName')}</label>
                  <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder={t('accounting.bank.bankNamePlaceholder')} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.accountName')}</label>
                  <input type="text" value={formData.account_name} onChange={(e) => setFormData({ ...formData, account_name: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder={t('accounting.bank.accountNamePlaceholder')} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.bank.accountNumber')}</label>
                  <input type="text" value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder={t('accounting.bank.accountNumberPlaceholder')} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.bank.swiftCode')}</label>
                  <input type="text" value={formData.swift_code} onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder={t('common.optional')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.bank.openingBalance')}</label>
                <input type="number" step="0.01" min="0" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="0.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={processing} className="btn-primary">
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />} {t('accounting.ui.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('accounting.transfer.title')}</h2>
              <button onClick={() => setShowTransfer(false)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.transfer.fromAccount')}</label>
                <select value={transferData.from_bank_account_id} onChange={(e) => setTransferData({ ...transferData, from_bank_account_id: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0FD452]" required>
                  <option value="">{t('accounting.transfer.selectSource')}</option>
                  {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {formatCurrency(a.current_balance)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('accounting.transfer.toAccount')}</label>
                <select value={transferData.to_bank_account_id} onChange={(e) => setTransferData({ ...transferData, to_bank_account_id: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0FD452]" required>
                  <option value="">{t('accounting.transfer.selectDestination')}</option>
                  {bankAccounts.filter((a) => a.id != transferData.from_bank_account_id).map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {formatCurrency(a.current_balance)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('orders.amount')}</label>
                  <input type="number" step="0.01" min="0.01" value={transferData.amount} onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('common.date')}</label>
                  <input type="date" value={transferData.transfer_date} onChange={(e) => setTransferData({ ...transferData, transfer_date: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#0FD452]" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('common.description')}</label>
                <input type="text" value={transferData.description} onChange={(e) => setTransferData({ ...transferData, description: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0FD452]" placeholder={t('accounting.transfer.descriptionPlaceholderMgmt')} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTransfer(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={processing} className="btn-primary">
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />} {t('accounting.transfer.transferBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReconcile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('accounting.bank.reconcileTitle')}</h2>
              <button onClick={() => { setShowReconcile(false); setSelectedTx([]) }} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">{t('accounting.bank.reconcileHint')}</p>
              <p className="text-sm text-gray-900 font-medium">{selectedTx.length} {t('accounting.bank.selectedTransactions')}</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowReconcile(false); setSelectedTx([]) }} className="btn-secondary">{t('common.cancel')}</button>
                <button onClick={handleReconcile} disabled={processing || selectedTx.length === 0} className="btn-primary">
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />} {t('accounting.bank.confirmReconcile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
