import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiBeaker } from 'react-icons/hi2';
import { IoChevronDown, IoPeople } from 'react-icons/io5';
import { TEMASIDE_CATEGORIES } from '../../constants/temasider';
import { useRolesQuery } from '../../hooks/queries/useRolesQuery';
import { useRoleStore } from '../../stores/roleStore';
import { getRoleIcon } from '../../utils/roleIcons';

interface MenuItem {
  path: string;
  title: string;
  isExternal?: boolean;
}

const menuItems: MenuItem[] = [
  ...TEMASIDE_CATEGORIES.map((category) => ({
    path: category.path,
    title: category.title,
  })),
  {
    path: 'https://www.helsedirektoratet.no/om-oss',
    title: 'Om Helsedirektoratet',
    isExternal: true,
  },
];

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function MenuDropdown({ isOpen, onClose, containerRef }: MenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [roleExpanded, setRoleExpanded] = useState(false);

  const { data: roles } = useRolesQuery();
  const role = useRoleStore((s) => s.role);
  const setRole = useRoleStore((s) => s.setRole);

  const selected = roles?.find((r) => r.slug === role);
  const selectedLabel = selected?.display_name ?? 'Alle';
  const SelectedIcon = selected ? getRoleIcon(selected.slug, selected.display_name) : IoPeople;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideDropdown = ref.current?.contains(target);
      const insideContainer = containerRef?.current?.contains(target);

      if (!insideDropdown && !insideContainer) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, containerRef]);

  useEffect(() => {
    if (!isOpen) setRoleExpanded(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasRoles = roles && roles.length > 0;

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg z-50 rounded-xl border border-gray-100 overflow-hidden">
      <nav className="px-2 py-2">
        {/* Role picker section */}
        <div className="mb-1">
          <button
            type="button"
            onClick={() => hasRoles && setRoleExpanded((v) => !v)}
            className="menu-role-trigger"
            aria-expanded={roleExpanded}
          >
            <div className="flex items-center gap-2.5">
              <SelectedIcon size={16} className="text-[#025169] opacity-80" />
              <div className="flex flex-col items-start">
                <span className="text-[0.7rem] font-medium text-[#025169] uppercase tracking-wide opacity-70">Rolle</span>
                <span className="text-[0.95rem] font-semibold text-[#025169]">{selectedLabel}</span>
              </div>
            </div>
            {hasRoles && (
              <IoChevronDown
                size={14}
                className="text-[#025169] opacity-60 transition-transform duration-200"
                style={{ transform: roleExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            )}
          </button>

          {roleExpanded && hasRoles && (
            <ul role="listbox" aria-label="Roller" className="menu-role-list">
              <li
                role="option"
                aria-selected={role === null}
                tabIndex={0}
                onClick={() => { setRole(null); setRoleExpanded(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRole(null); setRoleExpanded(false); } }}
                className={`menu-role-option${role === null ? ' menu-role-option--selected' : ''}`}
              >
                <IoPeople size={15} className="menu-role-option-icon" />
                Alle
              </li>
              {roles.map((r) => {
                const Icon = getRoleIcon(r.slug, r.display_name);
                return (
                  <li
                    key={r.slug}
                    role="option"
                    aria-selected={role === r.slug}
                    tabIndex={0}
                    onClick={() => { setRole(r.slug); setRoleExpanded(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRole(r.slug); setRoleExpanded(false); } }}
                    className={`menu-role-option${role === r.slug ? ' menu-role-option--selected' : ''}`}
                  >
                    <Icon size={15} className="menu-role-option-icon" />
                    {r.display_name}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 my-1" />

        {/* Navigation items */}
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          const className = `group flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-100 hover:bg-[#e8f4f8] ${isLast ? 'mt-1 border-t border-gray-100 pt-4' : ''}`;
          const content = (
            <>
              <span className="text-[0.95rem] text-gray-800 group-hover:text-[#025169] transition-colors">
                {item.title}
              </span>
              <HiArrowRight
                size={16}
                className="text-gray-400 group-hover:text-[#025169] group-hover:translate-x-0.5 transition-all duration-150"
              />
            </>
          );

          return item.isExternal ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              onClick={onClose}
            >
              {content}
            </a>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={className}
              onClick={onClose}
            >
              {content}
            </Link>
          );
        })}

        {/* Dev page link */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <Link
            to="/dev"
            className="group flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-100 hover:bg-[#e8f4f8]"
            onClick={onClose}
          >
            <span className="flex items-center gap-2 text-[0.95rem] text-gray-500 group-hover:text-[#025169] transition-colors">
              <HiBeaker size={16} />
              Dev
            </span>
            <HiArrowRight
              size={16}
              className="text-gray-400 group-hover:text-[#025169] group-hover:translate-x-0.5 transition-all duration-150"
            />
          </Link>
        </div>
      </nav>

      <style>{`
        .menu-role-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          background: #e6f2f6;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .menu-role-trigger:hover {
          background: #d4eaf1;
        }

        .menu-role-list {
          list-style: none;
          margin: 4px 0 0;
          padding: 4px 0;
          max-height: 260px;
          overflow-y: auto;
          animation: menuRoleFadeIn 0.15s ease;
        }

        .menu-role-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #334155;
          transition: background 0.12s ease;
        }
        .menu-role-option:hover {
          background: #f1f5f9;
        }
        .menu-role-option--selected {
          font-weight: 600;
          color: #025169;
          background: #e6f2f6;
        }
        .menu-role-option--selected:hover {
          background: #e6f2f6;
        }
        .menu-role-option-icon {
          flex-shrink: 0;
          opacity: 0.6;
        }
        .menu-role-option--selected .menu-role-option-icon {
          opacity: 1;
        }

        @keyframes menuRoleFadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
