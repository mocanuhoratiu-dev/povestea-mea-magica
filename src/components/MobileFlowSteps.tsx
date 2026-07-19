type MobileFlowStepsProps = {
  items: [string, string, string];
  accentClass: string;
};

export default function MobileFlowSteps({ items, accentClass }: MobileFlowStepsProps) {
  return (
    <ol className="mb-6 grid grid-cols-3 border-y border-brand-navy/10 py-3 md:hidden" aria-label="Etapele materialului">
      {items.map((item, index) => (
        <li key={item} className="flex min-w-0 items-center gap-2 px-2 text-xs font-black text-brand-navy/60 first:pl-0 last:pr-0">
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] text-white ${accentClass}`}>{index + 1}</span>
          <span className="truncate">{item}</span>
        </li>
      ))}
    </ol>
  );
}
