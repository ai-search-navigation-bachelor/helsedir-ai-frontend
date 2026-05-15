/** Header section rendered at the top of a content detail page; shows the content type label and title. */

type ContentPageHeaderProps = {
  typeLabel: string
  title: string
}

export function ContentPageHeader({ typeLabel, title }: ContentPageHeaderProps) {
  return (
    <header className="pb-1">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#025169]">
        {typeLabel}
      </p>
      <h1 className="font-title text-3xl font-bold leading-tight text-gray-900">{title}</h1>
    </header>
  )
}
