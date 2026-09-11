type PolicyContentsProps = {
  summary: string;
  sections: readonly { id: string; label: string }[];
};

export default function PolicyContents({ summary, sections }: PolicyContentsProps) {
  return <aside className="policy-overview">
    <p className="support-eyebrow">Pe scurt</p>
    <p>{summary}</p>
    <nav aria-label="Cuprinsul paginii">{sections.map(section => <a key={section.id} href={"#" + section.id}>{section.label}</a>)}</nav>
  </aside>;
}
