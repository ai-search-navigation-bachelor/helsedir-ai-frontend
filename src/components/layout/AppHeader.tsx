import { useState } from "react";
import { Button, CardBlock } from "@digdir/designsystemet-react";
import { Link } from "react-router-dom";

import { colors } from "../../styles/dsTokens";
import { MenuDropdown } from "../ui/MenuDropdown";

import { IoSearch, IoMenu, IoClose } from "react-icons/io5";

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        className="site-header"
        style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}
      >
        <header>
          <CardBlock className="site-header__card">
            <div className="site-header__inner">
              <Link
                to="/"
                aria-label="Helsedirektoratet"
                className="site-header__logo"
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
                  />
                </picture>
              </Link>

              <div className="site-header__actions">
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
          </CardBlock>
        </header>
        <MenuDropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </>
  );
}
