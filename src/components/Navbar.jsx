import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { IconArrow, IconBars, IconClose, IconMail, IconPhone } from './icons'
import LanguageSwitcher from './LanguageSwitcher'
import { DASHBOARD_URL, NAV_LINKS, SITE } from '../config'

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

function navClass(isActive) {
  return `relative text-xs font-semibold tracking-[1px] transition-colors duration-300 py-2 ${
    isActive ? 'text-[#0FD452]' : 'text-white/75 hover:text-white'
  }`
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b border-white/10 transition-all duration-300 ${
          scrolled ? 'bg-[#000F14]/90 backdrop-blur-lg shadow-lg' : 'bg-[#000F14]'
        }`}
      >
        <div className="hidden md:block border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-11 text-[11px]">
              <p className="min-w-0 truncate text-white/50">{SITE.tagline}</p>
              <div className="flex items-center gap-5">
                {SITE.contact.phones.map((phone) => (
                  <a
                    key={phone.number}
                    href={phone.href}
                    className="flex items-center gap-1.5 text-white/60 hover:text-[#0FD452] transition-colors"
                  >
                    <IconPhone className="w-3 h-3" />
                    <span className="text-white/40">{phone.label}</span>
                    <span className="font-semibold">{phone.number}</span>
                  </a>
                ))}
                <a
                  href={`mailto:${SITE.contact.email}`}
                  className="flex items-center gap-1.5 text-white/60 hover:text-[#0FD452] transition-colors"
                >
                  <IconMail className="w-3 h-3" />
                  {SITE.contact.email}
                </a>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="h-10 w-10 rounded-xl bg-[#0FD452] text-[#000F14] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105">
                <IconPill />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[#0FD452] font-bold text-lg tracking-wide whitespace-nowrap">HELIX</span>
                <span className="hidden xl:block text-white/40 text-[9px] font-semibold tracking-[2px] uppercase mt-1 whitespace-nowrap">
                  {SITE.subline}
                </span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              <ul className="flex items-center gap-5">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} className={({ isActive }) => navClass(isActive)}>
                      {({ isActive }) => (
                        <>
                          {link.label}
                          {isActive && (
                            <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#0FD452] rounded-full" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <a
                href={DASHBOARD_URL + '/login'}
                className="text-white/75 hover:text-white px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300"
              >
                SIGN IN
              </a>
              <a
                href={DASHBOARD_URL + '/register'}
                className="bg-[#0FD452] hover:bg-emerald-500 text-[#000F14] px-6 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 inline-flex items-center gap-2"
              >
                APPLY NOW
                <IconArrow className="w-3 h-3" />
              </a>
            </div>

            <button
              aria-label="Toggle navigation"
              aria-expanded={open}
              className="lg:hidden text-white text-xl p-2"
              onClick={() => setOpen(!open)}
            >
              {open ? <IconClose className="w-5 h-5" /> : <IconBars className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-[#0A1A22]/98 backdrop-blur-lg px-6 py-6 max-h-[calc(100vh-72px)] overflow-y-auto">
            <div className="mb-5">
              <LanguageSwitcher />
            </div>
            <ul className="flex flex-col gap-1 mb-6">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block py-3 text-sm font-semibold tracking-wider border-b border-white/5 transition-colors ${
                        isActive ? 'text-[#0FD452]' : 'text-white/75'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <a
              href={DASHBOARD_URL + '/login'}
              onClick={() => setOpen(false)}
              className="bg-white/10 text-white px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full"
            >
              SIGN IN
            </a>
            <a
              href={DASHBOARD_URL + '/register'}
              onClick={() => setOpen(false)}
              className="bg-[#0FD452] text-[#000F14] px-6 py-3 text-xs font-bold tracking-wider inline-block text-center w-full mt-2"
            >
              APPLY NOW
            </a>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
              {SITE.contact.phones.map((phone) => (
                <a
                  key={phone.number}
                  href={phone.href}
                  className="flex items-center gap-2 text-xs text-white/60"
                >
                  <IconPhone className="w-3.5 h-3.5 text-[#0FD452]" />
                  <span className="text-white/40">{phone.label}</span>
                  <span className="font-semibold text-white/80">{phone.number}</span>
                </a>
              ))}
              <a
                href={`mailto:${SITE.contact.email}`}
                className="flex items-center gap-2 text-xs text-white/60"
              >
                <IconMail className="w-3.5 h-3.5 text-[#0FD452]" />
                {SITE.contact.email}
              </a>
            </div>
          </div>
        )}
      </nav>

      <button
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-[#0FD452] text-[#000F14] shadow-lg hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <IconArrow className="w-4 h-4 rotate-90" />
      </button>
    </>
  )
}