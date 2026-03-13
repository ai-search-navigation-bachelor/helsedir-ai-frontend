import { createElement, type ComponentProps } from 'react'
import type { IconType } from 'react-icons'
import { IoPerson } from 'react-icons/io5'
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

export const ROLE_ICONS: Record<string, IconType> = {
  lege: FaUserMd,
  sykepleier: FaUserNurse,
  helsepersonell: FaStethoscope,
  leder: FaUserTie,
  offentlig: FaLandmark,
  it: FaLaptopMedical,
  forskning: FaFlask,
  næringsliv: FaBriefcase,
  media: FaNewspaper,
  jus: FaBalanceScale,
}

export function getRoleIconKey(slug: string, displayName?: string): string {
  if (ROLE_ICONS[slug]) return slug
  const lower = `${slug} ${displayName ?? ''}`.toLowerCase()
  const key = Object.keys(ROLE_ICONS).find((k) => {
    const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escapedKey}\\b`).test(lower)
  })
  return key ?? 'default'
}

type RoleIconProps = {
  slug?: string | null
  displayName?: string
} & ComponentProps<IconType>

export function RoleIcon({ slug, displayName, ...props }: RoleIconProps) {
  const key = slug ? getRoleIconKey(slug, displayName) : 'default'

  switch (key) {
    case 'lege':
      return createElement(FaUserMd, props)
    case 'sykepleier':
      return createElement(FaUserNurse, props)
    case 'helsepersonell':
      return createElement(FaStethoscope, props)
    case 'leder':
      return createElement(FaUserTie, props)
    case 'offentlig':
      return createElement(FaLandmark, props)
    case 'it':
      return createElement(FaLaptopMedical, props)
    case 'forskning':
      return createElement(FaFlask, props)
    case 'næringsliv':
      return createElement(FaBriefcase, props)
    case 'media':
      return createElement(FaNewspaper, props)
    case 'jus':
      return createElement(FaBalanceScale, props)
    default:
      return createElement(IoPerson, props)
  }
}
