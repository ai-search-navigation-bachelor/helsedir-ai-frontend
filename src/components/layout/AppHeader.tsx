import { useState } from "react";
import { Button } from "@digdir/designsystemet-react";
import { Link } from "react-router-dom";

import { colors } from "../../styles/dsTokens";
import { MenuDropdown } from "../ui/MenuDropdown";

import { IoSearch, IoMenu, IoClose } from "react-icons/io5";

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        className="w-full overflow-hidden"
        style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}
      >
        <header>
          <div className="w-full box-border">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-6 box-border px-12 py-12">
              <Link
                to="/"
                aria-label="Helsedirektoratet"
                className="flex items-center gap-3 shrink-0 min-w-0"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <picture>
                  <source
                    srcSet="/hdir_logo_small.svg"
                    media="(max-width: 640px)"
                  />
                  <img
                    src="/Hdir_logo.svg"
                    alt="Helsedirektoratet"
                    className="block h-8 w-auto"
                  />
                </picture>
              </Link>

              <div className="flex gap-3 items-center shrink-0 min-w-0">
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.dispatchEvent(new Event("toggleSearch"));
                  }}
                  aria-label="Søk"
                  className="site-header__button"
                >
                  Søk
                  <IoSearch size={18} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Meny"
                  aria-expanded={isMenuOpen}
                  className="site-header__button"
                >
                  {isMenuOpen ? <IoClose size={18} /> : <IoMenu size={18} />}
                  Meny
                </Button>
              </div>
            </div>
          </div>
        </header>
        <MenuDropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </>
  );
}
