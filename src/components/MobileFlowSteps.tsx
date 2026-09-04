type MobileFlowStepsProps = {
  items: [string, string, string];
  accentClass: string;
};

export default function MobileFlowSteps({ items, accentClass }: MobileFlowStepsProps) {
  return (
    <ol className="mb-6 grid grid-cols-3 border-y border-brand-navy/10 py-3 md:hidden" aria-label="Etapele materialului">
      {items.map((item, index) => (
        <li key={item} className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-black leading-tight text-brand-navy/60">
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] text-white ${accentClass}`}>{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
