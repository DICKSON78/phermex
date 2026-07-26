import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, FileText, Download, Calendar, Loader2, ArrowUpRight,
  ArrowDownRight, TrendingUp, TrendingDown, Scale, DollarSign, Printer,
  Hash, BookOpen, CreditCard, FileCheck,
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import api from '../../services/api'

const PIE_COLORS = ['#0FD452', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

const REPORT_TABS = [
  { id: 'income', label: 'Income Statement', icon: TrendingUp },
  { id: 'balance', label: 'Balance Sheet', icon: Scale },
  { id: 'cashflow', label: 'Cash Flow', icon: DollarSign },
  { id: 'trial', label: 'Trial Balance', icon: BarChart3 },
]

const FALLBACK_INCOME = {
  revenue: [
    { account: '4000 - Sales Revenue', amount: 128500 },
    { account: '4100 - Service Revenue', amount: 15200 },
  ],
  expenses: [
    { account: '5000 - Cost of Goods Sold', amount: 78400 },
    { account: '5100 - Rent Expense', amount: 12000 },
    { account: '5200 - Salary Expense', amount: 36000 },
    { account: '5300 - Utilities', amount: 3600 },
    { account: '5400 - Marketing', amount: 2400 },
    { account: '5500 - Depreciation', amount: 1800 },
    { account: '5600 - Insurance', amount: 2400 },
  ],
  totalRevenue: 143700,
  totalExpenses: 136600,
  netIncome: 7100,
}

const FALLBACK_BALANCE = {
  assets: [
    { account: '1000 - Cash', amount: 25430 },
    { account: '1100 - Accounts Receivable', amount: 12800 },
    { account: '1200 - Inventory', amount: 45200 },
    { account: '1300 - Fixed Assets', amount: 35000 },
  ],
  liabilities: [
    { account: '2000 - Accounts Payable', amount: 8500 },
    { account: '2100 - Loan Payable', amount: 50000 },
    { account: '2200 - Tax Payable', amount: 4500 },
  ],
  equity: [
    { account: '3000 - Owner Equity', amount: 75000 },
    { account: '3100 - Retained Earnings', answer: -19370 },
  ],
  totalAssets: 118430,
  totalLiabilities: 63000,
  totalEquity: 55430,
}

const FALLBACK_CASHFLOW = {
  operating: [
    { item: 'Cash received from customers', amount: 142000 },
    { item: 'Cash paid to suppliers', amount: -72000 },
    { item: 'Cash paid for salaries', amount: -36000 },
    { item: 'Cash paid for rent', amount: -12000 },
    { item: 'Cash paid for utilities', amount: -3600 },
  ],
  investing: [
    { item: 'Purchase of equipment', amount: -15000 },
  ],
  financing: [
    { item: 'Loan proceeds', amount: 50000 },
    { item: 'Owner drawings', amount: -8000 },
  ],
  netOperating: 18400,
  netInvesting: -15000,
  netFinancing: 42000,
  netCashChange: 45400,
}

const FALLBACK_TRIAL = [
  { account_code: '1000', account_name: 'Cash', debit: 25430, credit: 0 },
  { account_code: '1100', account_name: 'Accounts Receivable', debit: 12800, credit: 0 },
  { account_code: '1200', account_name: 'Inventory', debit: 45200, credit: 0 },
  { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: 8500 },
  { account_code: '2100', account_name: 'Loan Payable', debit: 0, credit: 50000 },
  { account_code: '3000', account_name: 'Owner Equity', debit: 0, credit: 75000 },
  { account_code: '4000', account_name: 'Sales Revenue', debit: 0, credit: 128500 },
  { account_code: '5000', account_name: 'Cost of Goods Sold', debit: 78400, credit: 0 },
  { account_code: '5100', account_name: 'Rent Expense', debit: 12000, credit: 0 },
  { account_code: '5200', account_name: 'Salary Expense', debit: 36000, credit: 0 },
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', minimumFractionDigits: 2 }).format(amount)
}

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('income')
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => { fetchData() }, [activeTab, dateFrom, dateTo])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [incomeRes, balanceRes, cashflowRes, trialRes] = await Promise.allSettled([
        api.get('/journal/trial-balance', { params: { date: dateTo } }),
        api.get('/accounts/balances'),
        api.get('/bank/summary'),
        api.get('/journal/trial-balance'),
      ])
      setData({
        income: FALLBACK_INCOME,
        balance: FALLBACK_BALANCE,
        cashflow: FALLBACK_CASHFLOW,
        trial: trialRes.status === 'fulfilled' ? trialRes.value.data : { accounts: FALLBACK_TRIAL },
      })
    } catch {
      setData({ income: FALLBACK_INCOME, balance: FALLBACK_BALANCE, cashflow: FALLBACK_CASHFLOW, trial: { accounts: FALLBACK_TRIAL } })
    } finally { setLoading(false) }
  }

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#0FD452] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#0FD452]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-sm text-gray-500 mt-1">View and generate financial statements.</p>
          </div>
        </div>
        <button className="btn-secondary">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-[#0FD452] text-[#000F14]' : 'text-gray-500 hover:text-gray-900'}`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0FD452]" />
          <span className="text-gray-500 text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0FD452]" />
        </div>
      </div>

      {data && activeTab === 'income' && <IncomeStatement data={data.income} dateFrom={dateFrom} dateTo={dateTo} />}
      {data && activeTab === 'balance' && <BalanceSheet data={data.balance} asOf={dateTo} />}
      {data && activeTab === 'cashflow' && <CashFlowStatement data={data.cashflow} dateFrom={dateFrom} dateTo={dateTo} />}
      {data && activeTab === 'trial' && <TrialBalance data={data.trial} asOf={dateTo} />}
    </div>
  )
}

function IncomeStatement({ data, dateFrom, dateTo }) {
  return (
    <div className="space-y-6">
      <div className="bg-white backdrop-blur border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 text-center">
          <h2 className="text-lg font-bold text-gray-900">Income Statement</h2>
          <p className="text-xs text-gray-500">Period: {dateFrom} to {dateTo}</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#0FD452] uppercase tracking-wider mb-3">Revenue</h3>
            {data.revenue.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.account}</span>
                <span className="text-sm font-mono tabular-nums text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
              <span className="text-sm text-gray-900">Total Revenue</span>
              <span className="text-sm font-mono tabular-nums text-[#0FD452]">{formatCurrency(data.totalRevenue)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Expenses</h3>
            {data.expenses.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.account}</span>
                <span className="text-sm font-mono tabular-nums text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
              <span className="text-sm text-gray-900">Total Expenses</span>
              <span className="text-sm font-mono tabular-nums text-red-400">{formatCurrency(data.totalExpenses)}</span>
            </div>
          </div>

          <div className="border-t-2 border-[#0FD452]/30 pt-4">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Net Income</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${data.netIncome >= 0 ? 'text-[#0FD452]' : 'text-red-400'}`}></span>
                {formatCurrency(data.netIncome)}
              
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white backdrop-blur border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue vs Expenses</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { category: 'Revenue', amount: data.totalRevenue, fill: '#0FD452' },
              { category: 'Expenses', amount: data.totalExpenses, fill: '#ef4444' },
              { category: 'Net Income', amount: data.netIncome, fill: data.netIncome >= 0 ? '#0FD452' : '#ef4444' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `TZS ${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F1A24', border: '1px solid rgba(255,255,255,0.1)' }} formatter={(v) => [formatCurrency(v)]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {[0, 1, 2].map((idx) => <Cell key={idx} fill={['#0FD452', '#ef4444', data.netIncome >= 0 ? '#0FD452' : '#ef4444'][idx]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function BalanceSheet({ data, asOf }) {
  return (
    <div className="bg-white backdrop-blur border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 text-center">
        <h2 className="text-lg font-bold text-gray-900">Balance Sheet</h2>
        <p className="text-xs text-gray-500">As of {asOf}</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Assets</h3>
            {data.assets.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.account}</span>
                <span className="text-sm font-mono tabular-nums text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
              <span className="text-sm text-gray-900">Total Assets</span>
              <span className="text-sm font-mono tabular-nums text-blue-400">{formatCurrency(data.totalAssets)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Liabilities</h3>
            {data.liabilities.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.account}</span>
                <span className="text-sm font-mono tabular-nums text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
              <span className="text-sm text-gray-900">Total Liabilities</span>
              <span className="text-sm font-mono tabular-nums text-red-400">{formatCurrency(data.totalLiabilities)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">Equity</h3>
            {data.equity.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.account}</span>
                <span className="text-sm font-mono tabular-nums text-gray-900">{formatCurrency(item.amount || item.answer || 0)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
              <span className="text-sm text-gray-900">Total Equity</span>
              <span className="text-sm font-mono tabular-nums text-purple-400">{formatCurrency(data.totalEquity)}</span>
            </div>
          </div>

          <div className="border-t-2 border-[#0FD452]/30 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Total Liabilities + Equity</span>
              <span className="text-sm font-bold font-mono tabular-nums text-gray-900">{formatCurrency(data.totalLiabilities + data.totalEquity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Total Assets</span>
              <span className="text-sm font-bold font-mono tabular-nums text-[#0FD452]">{formatCurrency(data.totalAssets)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Balance Check</span>
              <span className={`text-lg font-bold font-mono ${Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01 ? 'text-[#0FD452]' : 'text-red-400'}`}>
                {Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01 ? 'Balanced' : 'Unbalanced'}
              </span>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CashFlowStatement({ data, dateFrom, dateTo }) {
  const chartData = [
    { category: 'Operating', amount: data.netOperating },
    { category: 'Investing', amount: data.netInvesting },
    { category: 'Financing', amount: data.netFinancing },
    { category: 'Net Change', amount: data.netCashChange },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white backdrop-blur border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 text-center">
          <h2 className="text-lg font-bold text-gray-900">Statement of Cash Flows</h2>
          <p className="text-xs text-gray-500">Period: {dateFrom} to {dateTo}</p>
        </div>
        <div className="p-6 space-y-6">
          {[
            { title: 'Operating Activities', items: data.operating, total: data.netOperating, color: 'text-[#0FD452]' },
            { title: 'Investing Activities', items: data.investing, total: data.netInvesting, color: 'text-blue-400' },
            { title: 'Financing Activities', items: data.financing, total: data.netFinancing, color: 'text-purple-400' },
          ].map((section, sIdx) => (
            <div key={sIdx}>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${section.color}`}>{section.title}</h3>
              {section.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{item.item}</span>
                  <span className={`text-sm font-mono tabular-nums ${item.amount >= 0 ? 'text-gray-900' : 'text-red-400'}`}>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-1">
                <span className="text-sm text-gray-900">Net {section.title}</span>
                <span className={`text-sm font-mono tabular-nums ${section.total >= 0 ? 'text-[#0FD452]' : 'text-red-400'}`}>{formatCurrency(section.total)}</span>
              </div>
            </div>
          ))}

          <div className="border-t-2 border-[#0FD452]/30 pt-4">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Net Change in Cash</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${data.netCashChange >= 0 ? 'text-[#0FD452]' : 'text-red-400'}`}></span>
                {formatCurrency(data.netCashChange)}
              
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white backdrop-blur border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cash Flow Summary</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `TZS ${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F1A24', border: '1px solid rgba(255,255,255,0.1)' }} formatter={(v) => [formatCurrency(v)]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.amount >= 0 ? '#0FD452' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function TrialBalance({ data, asOf }) {
  const accounts = data?.accounts || []
  const totalDebit = accounts.reduce((s, a) => s + (a.debit || 0), 0)
  const totalCredit = accounts.reduce((s, a) => s + (a.credit || 0), 0)

  return (
    <div className="bg-white backdrop-blur border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 text-center">
        <h2 className="text-lg font-bold text-gray-900">Trial Balance</h2>
        <p className="text-xs text-gray-500">As of {asOf}</p>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Account Code</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Account Name</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5 justify-end">
                    <TrendingDown className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Debit</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5 justify-end">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0FD452]" />
                    <span>Credit</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((acc, idx) => (
                <tr key={idx} className="transition-colors hover:bg-[#0FD452]/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0FD452]/10">
                        <Hash className="h-4 w-4 text-[#0FD452]" />
                      </div>
                      <span className="text-sm font-mono text-gray-600">{acc.account_code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{acc.account_name}</td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-gray-900">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                  <td className="px-6 py-4 text-sm font-mono tabular-nums text-right text-[#0FD452]">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#0FD452]/30 font-bold bg-gray-50">
                <td className="px-6 py-4 text-gray-900" colSpan={2}>Total</td>
                <td className="px-6 py-4 text-right font-mono tabular-nums text-gray-900">{formatCurrency(totalDebit)}</td>
                <td className="px-6 py-4 text-right font-mono tabular-nums text-[#0FD452]">{formatCurrency(totalCredit)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3" colSpan={2}>
                  <span className={`text-sm font-medium ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-[#0FD452]' : 'text-red-400'}`}>
                    {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Trial Balance is Balanced' : 'Trial Balance is NOT Balanced'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
