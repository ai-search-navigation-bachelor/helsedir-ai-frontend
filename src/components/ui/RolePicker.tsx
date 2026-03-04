import { useEffect, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { IoChevronDown, IoPeople, IoPerson } from 'react-icons/io5'
import {
  FaUserNurse,
  FaUserMd,
  FaUserTie,
  FaStethoscope,
  FaLaptopMedical,
  FaFlask,
  FaBriefcase,
  FaBalanceScale,
  FaNewspaper,
  FaLandmark,
} from 'react-icons/fa'
import { useRolesQuery } from '../../hooks/queries/useRolesQuery'
import { useRoleStore } from '../../stores/roleStore'

const ROLE_ICONS: Record<string, IconType> = {
  lege: FaUserMd,
  sykepleier: FaUserNurse,
  helsepersonell: FaStethoscope,
  leder: FaUserTie,
  offentlig: FaLandmark,
  'it': FaLaptopMedical,
  forskning: FaFlask,
  næringsliv: FaBriefcase,
  media: FaNewspaper,
  jus: FaBalanceScale,
}

function getRoleIcon(slug: string, displayName?: string): IconType {
  if (ROLE_ICONS[slug]) return ROLE_ICONS[slug]
  const lower = `${slug} ${displayName ?? ''}`.toLowerCase()
  const key = Object.keys(ROLE_ICONS).find((k) => lower.includes(k))
  return key ? ROLE_ICONS[key] : IoPerson
}

export function RolePicker() {
  const { data: roles } = useRolesQuery()
  const role = useRoleStore((s) => s.role)
  const setRole = useRoleStore((s) => s.setRole)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = roles?.find((r) => r.slug === role)
  const selectedLabel = selected?.display_name ?? 'Velg rolle'
  const TriggerIcon = selected ? getRoleIcon(selected.slug, selected.display_name) : IoPerson

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasRoles = roles && roles.length > 0

  return (
    <div ref={ref} className="role-picker">
      <button
        type="button"
        onClick={() => hasRoles && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Velg rolle"
        className="role-picker__trigger"
        style={{ opacity: hasRoles ? 1 : 0.5, cursor: hasRoles ? 'pointer' : 'default' }}
      >
        <TriggerIcon size={15} className="role-picker__icon" />
        <span className="role-picker__label">{selectedLabel}</span>
        {hasRoles && (
          <IoChevronDown
            size={14}
            className="role-picker__chevron"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>

      {open && hasRoles && (
        <ul role="listbox" aria-label="Roller" className="role-picker__dropdown">
          <RoleOption
            label="Alle"
            Icon={IoPeople}
            selected={role === null}
            onSelect={() => { setRole(null); setOpen(false) }}
          />
          {roles.map((r) => (
            <RoleOption
              key={r.slug}
              label={r.display_name}
              Icon={getRoleIcon(r.slug, r.display_name)}
              selected={role === r.slug}
              onSelect={() => { setRole(r.slug); setOpen(false) }}
            />
          ))}
        </ul>
      )}

      <style>{`
        .role-picker {
          position: relative;
          min-width: 150px;
        }

        .role-picker__trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          border: 1px solid var(--ds-color-logobla-1-base-hover);
          background: #fff;
          color: var(--ds-color-logobla-1-text-default);
          font-size: 13px;
          font-weight: 400;
          transition: all 0.2s ease;
          width: 100%;
          white-space: nowrap;
        }
        .role-picker__trigger:hover {
          background: var(--ds-color-logobla-1-base-hover);
          color: var(--ds-color-logobla-1-base-contrast-default);
        }

        .role-picker__icon {
          opacity: 0.8;
          flex-shrink: 0;
        }

        .role-picker__label {
          flex: 1;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-picker__chevron {
          opacity: 0.7;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .role-picker__dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 100%;
          margin: 0;
          padding: 4px;
          list-style: none;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
          z-index: 100;
          animation: rolePickerFadeIn 0.15s ease;
        }

        .role-picker__option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 400;
          color: #334155;
          background: transparent;
          transition: background 0.15s ease;
          white-space: nowrap;
        }
        .role-picker__option:hover {
          background: #f1f5f9;
        }
        .role-picker__option--selected {
          font-weight: 600;
          color: #025169;
          background: #e6f2f6;
        }
        .role-picker__option--selected:hover {
          background: #e6f2f6;
        }
        .role-picker__option-icon {
          flex-shrink: 0;
          opacity: 0.6;
        }
        .role-picker__option--selected .role-picker__option-icon {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .role-picker {
            min-width: auto;
          }
          .role-picker__trigger {
            padding: 7px 10px;
            gap: 4px;
            justify-content: center;
          }
          .role-picker__label {
            display: none;
          }
          .role-picker__chevron {
            display: none;
          }
          .role-picker__dropdown {
            right: 0;
            left: auto;
            min-width: 200px;
          }
        }

        @keyframes rolePickerFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function RoleOption({ label, Icon, selected, onSelect }: {
  label: string
  Icon: IconType
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`role-picker__option${selected ? ' role-picker__option--selected' : ''}`}
    >
      <Icon size={16} className="role-picker__option-icon" />
      {label}
    </li>
  )
}
