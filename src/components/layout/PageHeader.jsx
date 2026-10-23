// Eyebrow label, title (with an optional gradient accent word), description
// and page actions.
export function PageHeader({ eyebrow, title, accent, description, children }) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-2xl space-y-3">
        {eyebrow && (
          <p className="font-semibold text-primary text-xs uppercase tracking-widest">{eyebrow}</p>
        )}
        <h1 className="font-bold text-3xl tracking-tight text-balance sm:text-4xl">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h1>
        {description && <p className="text-muted-foreground text-base text-pretty">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
