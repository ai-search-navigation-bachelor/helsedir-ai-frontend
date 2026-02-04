import { colors } from '../../styles/dsTokens';

export function AppFooter() {
  return (
    <footer
      style={{
        backgroundColor: colors.footerBg,
        color: '#ffffff',
        marginTop: 'auto',
      }}
    >
      {/* Main Footer Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Om Helsedirektoratet */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Om Helsedirektoratet</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-oss"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Om oss
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-oss/jobb-i-helsedirektoratet"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Jobbe hos oss
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-oss/kontakt-oss"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kontakt oss
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <p className="font-semibold">Postadresse:</p>
              <p>Helsedirektoratet</p>
              <p>Postboks 220, Skøyen</p>
              <p>0213 Oslo</p>
            </div>
          </div>

          {/* Column 2: Aktuelt */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Aktuelt</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.helsedirektoratet.no/nyheter"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nyheter
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/arrangementer"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Arrangementer
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/horinger"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Høringer
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/presse"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Presse
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Om nettstedet */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Om nettstedet</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-nettstedet/personvernerklaering"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Personvernerklæring
                </a>
              </li>
              <li>
                <a
                  href="https://www.uustatus.no/nb/erklaringer/publisert/d7e36f34-6fc3-48fd-a26e-34bb24f9b97d"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tilgjengelighetserklæring (uustatus.no)
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-nettstedet/besoksstatistikk-og-informasjonskapsler"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Besøksstatistikk og informasjonskapsler
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-nettstedet/nyhetsvarsel-og-abonnement"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nyhetsvarsel og abonnement
                </a>
              </li>
              <li>
                <a
                  href="https://www.helsedirektoratet.no/om-nettstedet/apne-data"
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Åpne data (API)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section with Logo and Social Media */}
      <div
        className="border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
      >
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/hdir_logo_small.svg"
                alt="Helsedirektoratet"
                className="h-8"
              />
              <span className="text-lg font-semibold">Helsedirektoratet</span>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <span className="text-sm">Følg oss:</span>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/helsedirektoratet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#005F73"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/helsedir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Twitter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#005F73"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/helsedirektoratet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#005F73"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
