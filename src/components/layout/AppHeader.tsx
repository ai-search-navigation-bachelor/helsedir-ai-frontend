import { useRef, useState } from "react";
import { Button } from "@digdir/designsystemet-react";
import { Link } from "react-router-dom";

import { colors } from "../../styles/dsTokens";
import { MenuDropdown } from "../ui/MenuDropdown";
import { useRoleStore } from "../../stores/roleStore";
import { useRolesQuery } from "../../hooks/queries/useRolesQuery";
import { getRoleIcon } from "../../utils/roleIcons";

import { IoSearch, IoMenu, IoClose } from "react-icons/io5";

type AppHeaderProps = {
  searchVisible?: boolean;
};

export function AppHeader({ searchVisible = false }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const role = useRoleStore((s) => s.role);
  const { data: roles } = useRolesQuery();
  const selectedRole = roles?.find((r) => r.slug === role);
  const RoleIcon = selectedRole ? getRoleIcon(selectedRole.slug, selectedRole.display_name) : null;

  return (
      <div
        className="relative w-full"
        style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}
      >
        <header>
          <div className="w-full box-border">
            <div className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-3 box-border px-4 pt-6 sm:gap-4 sm:px-6 sm:pt-8 lg:gap-6 lg:px-12 lg:pt-10 ${searchVisible ? "pb-4 sm:pb-5" : "pb-6 sm:pb-8 lg:pb-10"}`}>
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
                <div ref={menuContainerRef} className="relative">
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
                  {RoleIcon && !isMenuOpen && (
                    <span
                      className="role-badge"
                      role="img"
                      aria-label={`Rolle: ${selectedRole?.display_name ?? ''}`}
                    >
                      <RoleIcon size={11} />
                    </span>
                  )}
                  <MenuDropdown
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    containerRef={menuContainerRef}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
        <style>{`
          .role-badge {
            position: absolute;
            top: -4px;
            right: -6px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #025169;
            color: #fff;
            border: 2px solid ${colors.headerBg};
            pointer-events: none;
            animation: roleBadgePop 0.25s ease;
          }
          @keyframes roleBadgePop {
            0% { transform: scale(0); }
            70% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
  );
}
