import React from 'react'

export default function Tabs({ tabs, active, onChange, className = 'mb-5' }) {
  return (
    <div className={`flex items-center gap-1 border-b border-gray-200 flex-wrap ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        const count = typeof tab.count === 'function' ? tab.count() : tab.count
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              isActive ? 'border-[#0FD452] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {count != null && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#0FD452]/15 text-[#0FD452]' : 'bg-gray-100 text-gray-400'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}