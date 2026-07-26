import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, MessageCircle, User } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home', match: ['/'] },
  { to: '/orders', icon: ClipboardList, label: 'Orders', match: ['/orders'] },
  { to: '/chats', icon: MessageCircle, label: 'Chat', match: ['/chats', '/chat'] },
  { to: '/profile', icon: User, label: 'Me', match: ['/profile', '/prescriptions'] },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-[68px] max-w-lg mx-auto px-2">
        {items.map(({ to, icon: Icon, label, match }) => {
          const active = match.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-[#0FD452] scale-105'
                  : 'text-gray-400 active:scale-95'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${active ? 'bg-[#0FD452]' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className={active ? 'text-white' : ''} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-[#0FD452] font-bold' : ''}`}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
