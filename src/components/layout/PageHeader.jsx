// Numbered mono eyebrow on a hairline rule, a large tight headline (the accent
// word drops to muted grey) and page actions.
export function PageHeader({ index, eyebrow, title, accent, description, children }) {
  return (
    <header className="space-y-8">
      {eyebrow && (
        <div className="label-mono flex items-center gap-4 border-b pb-4 text-muted-foreground">
          {index && <span className="text-highlight">{index}</span>}
          {index && <span className="h-px w-10 bg-border" aria-hidden="true" />}
          <span>{eyebrow}</span>
        </div>
      )}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-2xl space-y-4">
          <h1 className="font-semibold text-4xl text-titanium leading-[1.02] tracking-[-0.035em] text-balance sm:text-5xl">
            {title} {accent && <span className="text-muted-foreground">{accent}</span>}
          </h1>
          {description && <p className="text-lg text-muted-foreground leading-relaxed text-pretty">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
