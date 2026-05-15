/** Application footer with Helsedirektoratet branding and social media links. */
import { FaFacebookF, FaLinkedinIn } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { colors } from '../../styles/dsTokens'

const footerLinks = [
  {
    heading: 'Om Helsedirektoratet',
    links: [
      { label: 'Om oss', href: 'https://www.helsedirektoratet.no/om-oss' },
      { label: 'Jobbe hos oss', href: 'https://www.helsedirektoratet.no/om-oss/jobb-i-helsedirektoratet' },
      { label: 'Kontakt oss', href: 'https://www.helsedirektoratet.no/om-oss/kontakt-oss' },
    ],
  },
  {
    heading: 'Aktuelt',
    links: [
      { label: 'Nyheter', href: 'https://www.helsedirektoratet.no/nyheter' },
      { label: 'Arrangementer', href: 'https://www.helsedirektoratet.no/arrangementer' },
      { label: 'Høringer', href: 'https://www.helsedirektoratet.no/horinger' },
      { label: 'Presse', href: 'https://www.helsedirektoratet.no/presse' },
    ],
  },
  {
    heading: 'Om nettstedet',
    links: [
      { label: 'Personvernerklæring', href: 'https://www.helsedirektoratet.no/om-nettstedet/personvernerklaering' },
      { label: 'Tilgjengelighetserklæring', href: 'https://www.uustatus.no/nb/erklaringer/publisert/d7e36f34-6fc3-48fd-a26e-34bb24f9b97d' },
      { label: 'Besøksstatistikk og informasjonskapsler', href: 'https://www.helsedirektoratet.no/om-nettstedet/besoksstatistikk-og-informasjonskapsler' },
      { label: 'Nyhetsvarsel og abonnement', href: 'https://www.helsedirektoratet.no/om-nettstedet/nyhetsvarsel-og-abonnement' },
      { label: 'Åpne data (API)', href: 'https://www.helsedirektoratet.no/om-nettstedet/apne-data' },
    ],
  },
]

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/helsedirektoratet', icon: FaFacebookF },
  { label: 'Twitter / X', href: 'https://twitter.com/helsedir', icon: FaXTwitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/helsedirektoratet', icon: FaLinkedinIn },
]

export function AppFooter() {
  return (
    <footer style={{ backgroundColor: colors.footerBg, color: '#fff', marginTop: 'auto' }}>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h3 className="font-title text-base font-semibold mb-4 text-white">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/70 hover:text-white transition-colors duration-150 hover:underline underline-offset-2"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              {col.heading === 'Om Helsedirektoratet' && (
                <div className="mt-6 text-sm text-white/60 space-y-0.5">
                  <p className="font-medium text-white/80">Postadresse:</p>
                  <p>Helsedirektoratet</p>
                  <p>Postboks 220, Skøyen</p>
                  <p>0213 Oslo</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/hdir_logo_small.svg" alt="Helsedirektoratet" className="h-7 opacity-90" />
            <span className="text-sm font-medium text-white/80">Helsedirektoratet</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 mr-1">Følg oss</span>
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:bg-white/20"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
