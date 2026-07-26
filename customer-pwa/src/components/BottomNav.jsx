import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, User } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-[#0FD452]' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-[#0FD452] -mt-0.5" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
