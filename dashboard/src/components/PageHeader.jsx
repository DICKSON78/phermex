import React from 'react'

export default function PageHeader({ icon, title, subtitle, actions, className = 'mb-6' }) {
  const Icon = icon
  return (
    <div className={`flex items-center justify-between flex-wrap gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#0FD452]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#0FD452]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  )
}