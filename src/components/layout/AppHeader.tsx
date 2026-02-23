import { useState } from "react";
import { Button } from "@digdir/designsystemet-react";
import { Link } from "react-router-dom";

import { colors } from "../../styles/dsTokens";
import { MenuDropdown } from "../ui/MenuDropdown";

import { IoSearch, IoMenu, IoClose } from "react-icons/io5";

type AppHeaderProps = {
  searchVisible?: boolean;
};

export function AppHeader({ searchVisible = false }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
      <div
        className="relative w-full"
        style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}
      >
        <header>
          <div className="w-full box-border">
            <div className={`w-full max-w-7xl mx-auto flex items-center justify-between gap-6 box-border px-12 pt-10 ${searchVisible ? "pb-5" : "pb-10"}`}>
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
                <div className="relative">
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
                  <MenuDropdown
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
  );
}
