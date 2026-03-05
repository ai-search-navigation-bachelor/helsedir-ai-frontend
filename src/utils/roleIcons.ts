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

export function getRoleIcon(slug: string, displayName?: string): IconType {
  if (ROLE_ICONS[slug]) return ROLE_ICONS[slug]
  const lower = `${slug} ${displayName ?? ''}`.toLowerCase()
  const key = Object.keys(ROLE_ICONS).find((k) => lower.includes(k))
  return key ? ROLE_ICONS[key] : IoPerson
}
