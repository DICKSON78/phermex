import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes, faChevronUp, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { DASHBOARD_URL } from '../config'
import LanguageSwitcher from './LanguageSwitcher'

const navLinks = [
  { label: 'HOME', to: '/' },
  { label: 'ABOUT', to: '/about' },
  { label: 'PRODUCTS', to: '/products' },
  { label: 'PACKAGES', to: '/packages' },
  { label: 'CAREERS', to: '/careers' },
  { label: 'NEWSROOM', to: '/newsroom' },
  { label: 'FAQ', to: '/faq' },
  { label: 'CONTACT', to: '/contact' },
]

function IconPill() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M8 21h8a2 2 0 0 0 2-2v-3H6v3a2 2 0 0 0 2 2z"/>
      <path d="M3 14s2 0 2-2V5a2 2 0 0 1 4 0v7"/>
      <path d="M9 14s2 0 2-2V5a2 2 0 0 1 4 0v7"/>
      <path d="M15 14s2 0 2-2V5a2 2 0 0 1 4 0v7"/>
    </svg>
  )
}

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
            ? 'bg-[#000F14]/80 backdrop-blur-lg shadow-lg border-b border-white/10'
            : 'bg-[#000F14]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-2">
              <span className="h-10 w-10 rounded-xl bg-[#0FD452] text-[#000F14] flex items-center justify-center">
                <IconPill />
              </span>
              <span className="text-[#0FD452] font-bold text-lg tracking-wide">HELIX</span>
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
              <LanguageSwitcher />
              <a
                href={DASHBOARD_URL + '/login'}
                className="text-white/80 hover:text-white px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              >
                SIGN IN
              </a>
              <a
                href={DASHBOARD_URL + '/register'}
                className="bg-[#0FD452] hover:bg-emerald-500 text-[#000F14] px-6 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 inline-flex items-center gap-2"
              >
                APPLY NOW
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
              </a>
            </div>

            <button className="lg:hidden text-white text-xl p-2" onClick={() => setOpen(!open)}>
              <FontAwesomeIcon icon={open ? faTimes : faBars} />
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-[#0A1A22]/95 backdrop-blur-lg px-6 py-6">
            <div className="mb-5">
              <LanguageSwitcher />
            </div>
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
            <a href={DASHBOARD_URL + '/login'} onClick={() => setOpen(false)} className="bg-white/10 text-white px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full">
              SIGN IN
            </a>
            <a href={DASHBOARD_URL + '/register'} onClick={() => setOpen(false)} className="bg-[#0FD452] text-[#000F14] px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full mt-2">
              APPLY NOW
            </a>
          </div>
        )}
      </nav>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-[#0FD452] text-[#000F14] shadow-lg hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <FontAwesomeIcon icon={faChevronUp} />
      </button>
    </>
  )
}
