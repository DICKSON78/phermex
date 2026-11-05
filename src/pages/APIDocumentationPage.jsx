import React, { useState } from 'react'
import { Copy, Check, ExternalLink, Code, BookOpen } from 'lucide-react'

const APIDocumentationPage = () => {
  const [copied, setCopied] = useState(null)

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/50 border-b border-emerald-500/20 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white">Helix API</h1>
              <p className="text-emerald-400 mt-2">Pharmacy Management Platform</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
                <p className="text-emerald-400 text-sm font-bold">🟢 Live & Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-[100px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { name: 'Overview', id: 'overview' },
              { name: 'Subscriptions', id: 'subscriptions' },
              { name: 'e-Prescriptions', id: 'eprescriptions' },
              { name: 'Wholesale', id: 'wholesale' },
              { name: 'Authentication', id: 'auth' },
            ].map(tab => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="py-4 px-1 text-slate-300 hover:text-emerald-400 font-semibold transition border-b-2 border-transparent hover:border-emerald-400"
              >
                {tab.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Overview Section */}
        <section id="overview" className="mb-16">
          <h2 className="text-3xl font-black text-white mb-6">API Overview</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: '💳',
                title: 'Subscriptions API',
                desc: '3 subscription plans with 30-day free trial, annual billing, and grace period management'
              },
              {
                icon: '💊',
                title: 'e-Prescription API',
                desc: 'MoH health system integration for prescription submission, tracking, and delivery'
              },
              {
                icon: '🏭',
                title: 'Wholesale API',
                desc: 'Wholesaler management, inventory, pricing, orders, returns, and analytics'
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 transition">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-3">🚀 Base URL</h3>
            <code className="text-slate-200 text-sm bg-black/50 p-3 rounded block">
              https://helix.co.tz/api
            </code>
          </div>
        </section>

        {/* Subscriptions Section */}
        <section id="subscriptions" className="mb-16">
          <h2 className="text-3xl font-black text-white mb-6">Subscriptions API</h2>
          
          <div className="space-y-6">
            {/* Get Plans */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded font-bold text-sm">GET</span>
                <code className="text-slate-300">/subscriptions/plans</code>
              </div>
              <p className="text-slate-400 mb-4">Get all subscription plans with pricing</p>
              
              <div className="bg-black/50 p-4 rounded mb-4">
                <div className="text-sm text-slate-500 mb-2">Response:</div>
                <code className="text-emerald-400 text-xs overflow-x-auto block whitespace-pre-wrap break-words">
                  {`{
  "data": [
    {
      "id": 1,
      "name": "STARTER",
      "price": 14.99,
      "price_monthly": 14.99
    },
    {
      "id": 2,
      "name": "PROFESSIONAL",
      "price": 19.99,
      "price_monthly": 19.99
    },
    {
      "id": 3,
      "name": "ENTERPRISE",
      "price": 29.99,
      "price_monthly": 29.99
    }
  ]
}`}
                </code>
              </div>

              <button
                onClick={() => copyToClipboard('curl https://helix.co.tz/api/subscriptions/plans', 'sub-get')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition"
              >
                {copied === 'sub-get' ? <Check size={16} /> : <Copy size={16} />}
                {copied === 'sub-get' ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
          </div>
        </section>

        {/* e-Prescriptions Section */}
        <section id="eprescriptions" className="mb-16">
          <h2 className="text-3xl font-black text-white mb-6">e-Prescription API</h2>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-emerald-400 font-bold mb-3">🔐 Authentication Required</h3>
            <p className="text-slate-300 mb-3">All e-Prescription endpoints require Bearer token authentication:</p>
            <code className="text-slate-200 bg-black/50 p-3 rounded block text-sm">
              Authorization: Bearer {'{your_api_key}'}
            </code>
          </div>

          <div className="space-y-6">
            {[
              {
                method: 'POST',
                path: '/eprescriptions/submit',
                desc: 'Submit e-prescription from MoH health system'
              },
              {
                method: 'GET',
                path: '/eprescriptions/{id}',
                desc: 'Retrieve prescription details by ID'
              },
              {
                method: 'POST',
                path: '/eprescriptions/{id}/fulfill',
                desc: 'Pharmacy marks prescription as fulfilled'
              },
              {
                method: 'POST',
                path: '/eprescriptions/{id}/wholesale-order',
                desc: 'Create wholesale order from prescription'
              },
              {
                method: 'GET',
                path: '/eprescriptions/{id}/delivery-status',
                desc: 'Track real-time delivery status'
              },
            ].map((endpoint, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded font-bold text-sm ${
                    endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-slate-300">{endpoint.path}</code>
                </div>
                <p className="text-slate-400 text-sm">{endpoint.desc}</p>
              </div>
            ))}
          </div>

          <a
            href="https://helix.co.tz/docs/eprescription-api.md"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            <BookOpen size={18} />
            Full e-Prescription Documentation
            <ExternalLink size={16} />
          </a>
        </section>

        {/* Wholesale Section */}
        <section id="wholesale" className="mb-16">
          <h2 className="text-3xl font-black text-white mb-6">Wholesale API</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-400 font-bold mb-3">🏢 Wholesaler Management</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Register wholesalers</li>
                <li>✓ Manage inventory & stock</li>
                <li>✓ Set dynamic pricing</li>
                <li>✓ View analytics</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-emerald-400 font-bold mb-3">📋 Order Management</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>✓ Create orders</li>
                <li>✓ Track fulfillment</li>
                <li>✓ Process returns</li>
                <li>✓ Manage payments</li>
              </ul>
            </div>
          </div>

          <a
            href="https://helix.co.tz/docs/wholesale-system.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            <BookOpen size={18} />
            Full Wholesale Documentation
            <ExternalLink size={16} />
          </a>
        </section>

        {/* Authentication Section */}
        <section id="auth" className="mb-16">
          <h2 className="text-3xl font-black text-white mb-6">Authentication</h2>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-emerald-400 font-bold mb-2">📝 API Key Setup</h3>
              <p className="text-slate-400">Contact api@helix.co.tz to register your system and receive an API key.</p>
            </div>

            <div>
              <h3 className="text-emerald-400 font-bold mb-2">🔑 Using Your API Key</h3>
              <code className="text-slate-200 bg-black/50 p-3 rounded block text-sm whitespace-pre-wrap break-words">
                {`curl -X GET https://helix.co.tz/api/subscriptions/plans \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json"`}
              </code>
            </div>

            <div>
              <h3 className="text-emerald-400 font-bold mb-2">✅ Rate Limiting</h3>
              <p className="text-slate-400">1000 requests per hour per API key</p>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-emerald-400 font-bold mb-2">📧 Email</h3>
              <a href="mailto:api@helix.co.tz" className="text-slate-300 hover:text-emerald-400 transition">
                api@helix.co.tz
              </a>
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold mb-2">📚 Documentation</h3>
              <p className="text-slate-400 text-sm">Complete guides available in docs folder</p>
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold mb-2">🌐 Status</h3>
              <p className="text-emerald-400 text-sm">🟢 All systems operational</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="bg-black/50 border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2026 Helix Pharmacy Management. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default APIDocumentationPage
