import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes, faChevronUp } from '@fortawesome/free-solid-svg-icons'

const navLinks = [
  { label: 'HOME', to: '/' },
  { label: 'ABOUT', to: '/about' },
  { label: 'PRODUCTS', to: '/products' },
  { label: 'CAREERS', to: '/careers' },
  { label: 'NEWSROOM', to: '/newsroom' },
  { label: 'FAQ', to: '/faq' },
  { label: 'CONTACT', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#000F14]/80 backdrop-blur-lg shadow-lg'
            : 'bg-[#000F14]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.jpeg" alt="Pharmex" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-[#0FD452] font-bold text-lg tracking-wide">PHARMEX</span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <ul className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `text-xs font-semibold tracking-[1px] transition-colors duration-300 ${
                          isActive ? 'text-[#0FD452]' : 'text-white/80 hover:text-white'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <NavLink
                to="/apply"
                className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              >
                APPLY NOW
              </NavLink>
            </div>

            <button className="lg:hidden text-white text-xl p-2" onClick={() => setOpen(!open)}>
              <FontAwesomeIcon icon={open ? faTimes : faBars} />
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-[#0A1A22]/95 backdrop-blur-lg px-6 py-6">
            <ul className="flex flex-col gap-4 mb-6">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `text-sm font-semibold tracking-wider transition-colors ${
                        isActive ? 'text-[#0FD452]' : 'text-white/80 hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <NavLink to="/apply" onClick={() => setOpen(false)} className="bg-brand text-white px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full">
              APPLY NOW
            </NavLink>
          </div>
        )}
      </nav>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-[#0FD452] text-white shadow-lg hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <FontAwesomeIcon icon={faChevronUp} />
      </button>
    </>
  )
}
