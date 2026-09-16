"use client";

import type { SampleShortcut } from "@/lib/sampleNavigation";

export default function SamplePageNavigation({ pages, shortcuts, selected, onSelect }: {
  pages: { title: string }[];
  shortcuts: SampleShortcut[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return <nav className="sample-navigation" aria-label="Cuprinsul mostrei" data-lumi-obstacle>
    <div className="sample-shortcuts">{shortcuts.map(({ index, label }) => <button
      key={index} type="button" onClick={() => onSelect(index)}
      aria-current={selected === index ? "page" : undefined}
    >{label}</button>)}</div>
    <label className="sample-page-select"><span>Toate paginile</span><select
      value={selected} onChange={event => onSelect(Number(event.target.value))}
    >{pages.map((page, index) => <option key={index} value={index}>{index + 1}. {page.title}</option>)}</select></label>
  </nav>;
}
