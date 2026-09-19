import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faLinkedinIn, faYoutube } from '@fortawesome/free-brands-svg-icons'

const companyLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Careers', to: '/careers' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Newsroom', to: '/newsroom' },
  { label: 'Contact', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="bg-[#000F14] text-white py-16 lg:py-20" id="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div>
            <h4 className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-5">OFFICES</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><span className="text-white font-semibold">Dar es Salaam,</span> Tanzania</li>
              <li><span className="text-white font-semibold">Arusha,</span> Tanzania</li>
              <li><span className="text-white font-semibold">Mwanza,</span> Tanzania</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-5">COMPANY</h4>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-5">KEEP IN TOUCH</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="tel:+255 669 254 444" className="hover:text-white transition-colors">+255 669 254 444</a>
              </li>
              <li>
                <a href="mailto:support@helix.co.tz" className="hover:text-white transition-colors">support@helix.co.tz</a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a
                href="https://www.linkedin.com/in/helix-co-ltd-part-of-allos-holding-co-ltd-299605359"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] transition-all"
              >
                <FontAwesomeIcon icon={faLinkedinIn} className="text-xs" />
              </a>
              <a
                href="https://www.instagram.com/helix_co.ltd?igsh=YW1qNDI0YmtibXAz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] transition-all"
              >
                <FontAwesomeIcon icon={faInstagram} className="text-xs" />
              </a>
              <a
                href="https://www.youtube.com/@helix_co.ltd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] transition-all"
              >
                <FontAwesomeIcon icon={faYoutube} className="text-xs" />
              </a>
            </div>
          </div>

          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src="/helix-logo.png" alt="Helix" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-[#0FD452] font-bold text-lg tracking-wide">HELIX</span>
            </Link>
            <p className="text-gray-500 text-xs mt-4 leading-relaxed">
              Empowering pharmacies across Africa with modern digital tools for better health outcomes.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
          <p>&copy; {new Date().getFullYear()} Helix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
