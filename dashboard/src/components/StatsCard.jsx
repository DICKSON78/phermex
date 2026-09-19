import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ icon: Icon, label, value, trend, up, subtitle, color = 'bg-primary-light text-primary' }) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
              {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
              <span className="text-gray-400 font-normal">vs yesterday</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`stat-icon group-hover:scale-110 transition-transform duration-300 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
