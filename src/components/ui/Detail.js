// A labelled fact with an icon, e.g. "VENUE / Harbor Amphitheater". Use
// inside a <dl>.
export default function Detail({ icon: Icon, label, value, note }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary-text" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
        {note && <dd className="text-sm text-muted-foreground">{note}</dd>}
      </div>
    </div>
  );
}
