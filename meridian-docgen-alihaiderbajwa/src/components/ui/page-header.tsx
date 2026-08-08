export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div>
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/65">Meridian workspace</p>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.025em]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
