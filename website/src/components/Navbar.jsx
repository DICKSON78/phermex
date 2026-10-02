import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes, faChevronUp, faHouse, faLayerGroup, faCompassDrafting, faDiagramProject, faEnvelope, faPhone, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { DASHBOARD_URL } from '../config'
import LanguageSwitcher from './LanguageSwitcher'

const navLinks = [
  { label: 'Home', icon: faHouse, to: '/' },
  { label: 'About', icon: faCompassDrafting, to: '/about' },
  { label: 'Products', icon: faLayerGroup, to: '/products' },
  { label: 'Packages', icon: faDiagramProject, to: '/packages' },
  { label: 'Careers', icon: faEnvelope, to: '/careers' },
  { label: 'Newsroom', icon: faLayerGroup, to: '/newsroom' },
  { label: 'FAQ', icon: faLayerGroup, to: '/faq' },
  { label: 'Contact', icon: faEnvelope, to: '/contact' },
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
      <header className={`fixed inset-x-0 top-0 z-50 overflow-hidden border-b border-white/10 bg-[#000F14]/95 text-white shadow-xl shadow-[#000F14]/10 backdrop-blur-xl transition duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
        <div className="relative">
          <div className="container-shell">
            <div className="flex min-h-[84px] items-center gap-5">
              <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Helix home">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0FD452]/50 bg-[#0A1A22] shadow-lg shadow-black/20">
                  <img src="/helix-logo.png" alt="" width="36" height="36" className="h-9 w-9 rounded-lg" />
                </span>
                <span>
                  <span className="block text-base font-bold leading-none tracking-[0.14em] text-white">HELIX</span>
                </span>
              </Link>

              <span className="hidden h-9 w-px bg-white/10 lg:block" aria-hidden="true"></span>

              <nav className="hidden min-w-0 flex-1 items-stretch justify-center gap-1 lg:flex" aria-label="Primary navigation">
                {navLinks.map((link, idx) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 border border-transparent px-3 py-2.5 text-xs font-medium text-slate-300 transition duration-300 ${
                        isActive ? 'border-[#0FD452]/30 bg-[#0FD452]/10 text-white' : 'hover:border-white/10 hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="hidden text-[9px] font-semibold tracking-[0.18em] text-slate-500 xl:inline">{String(idx+1).padStart(2,'0')}</span>
                        <FontAwesomeIcon icon={link.icon} className={`text-sm ${isActive ? 'text-[#0FD452]' : 'text-[#0FD452]/80'}`} />
                        <span>{link.label}</span>
                        {isActive && (
                          <span className="absolute inset-x-3 -bottom-px h-px bg-[#0FD452]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="ml-auto hidden items-center gap-3 lg:flex">
                <LanguageSwitcher />
                <a href={DASHBOARD_URL + '/login'} className="text-white/75 hover:text-white px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300">
                  SIGN IN
                </a>
                <a href={DASHBOARD_URL + '/register'} className="group inline-flex min-h-11 items-center gap-3 rounded-[1.25rem] border border-[#0FD452]/50 bg-[#0FD452] px-5 py-3 text-sm font-semibold text-[#000F14] transition duration-300 hover:-translate-y-0.5 hover:border-[#0FD452] hover:bg-emerald-500">
                  <span>APPLY NOW</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>

              <button type="button" onClick={() => setOpen(!open)} className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white transition hover:border-[#0FD452]/50 hover:bg-white/10 lg:hidden">
                <FontAwesomeIcon icon={open ? faTimes : faBars} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-[#000F14] lg:hidden">
            <nav className="container-shell py-5">
              <div className="grid gap-2">
                {navLinks.map((link, idx) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition duration-300 ${
                        isActive ? 'text-[#0FD452]' : 'text-white/75'
                      }`
                    }
                  >
                    <span className="w-6 text-[10px] font-semibold tracking-[0.18em] text-[#0FD452]">{String(idx+1).padStart(2,'0')}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#0FD452]">
                      <FontAwesomeIcon icon={link.icon} className="text-sm" />
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-500" />
                  </NavLink>
                ))}
              </div>
              <div className="mt-5">
                <LanguageSwitcher />
              </div>
              <div className="mt-3 space-y-2">
                <a href={DASHBOARD_URL + '/login'} onClick={() => setOpen(false)} className="bg-white/10 text-white px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full">
                  SIGN IN
                </a>
                <a href={DASHBOARD_URL + '/register'} onClick={() => setOpen(false)} className="bg-[#0FD452] text-[#000F14] px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full">
                  APPLY NOW
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

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
