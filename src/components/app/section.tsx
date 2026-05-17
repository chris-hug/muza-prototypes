"use client"

/*
 * Section — shared page-section primitive for both detail pages
 * (buyer purchase detail, seller order detail).
 *
 * Default chrome is FLAT — heading + content with no border, no fill,
 * just vertical rhythm carrying separation between sections. Pass
 * `boxed` for the rare case where the inner content is a list of
 * products / data rows that benefits from a card-shaped container
 * (currently only the Items section).
 *
 * Heading sits OUT of the box so boxed and unboxed sections share the
 * same hierarchy (page-section heading → block of content), and stacks
 * of flat sections don't read as a wall of identical chrome.
 */

export function Section({
  title, children, action, boxed = false,
}: {
  title?:   string
  children: React.ReactNode
  action?:  React.ReactNode
  boxed?:   boolean
}) {
  return (
    <section>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-large font-medium text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {boxed ? (
        <div className="bg-background border border-border rounded-xl px-5 py-4">
          {children}
        </div>
      ) : children}
    </section>
  )
}
