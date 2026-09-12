const textRegions = 'p,h2,h3,.note,.quote,.gold-dedication,.gold-certificate-copy,.gold-adult,.gold-ingredients,.gold-ritual-title,.gold-step-copy,.gold-formula,.gold-main-label,.gold-round-copy,.gold-door-copy,.gold-ritual-strip,.gold-safety';

export function prepareKitFontMetrics(): () => void {
  // Tailwind makes images block-level, breaking html2canvas's inline baseline probe.
  // Target only its 1px probe, never the artwork or other application images.
  const style = document.createElement('style');
  style.textContent = 'img[src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"]{display:inline-block!important}';
  document.head.appendChild(style);
  return () => style.remove();
}

export function kitPrintOverflows(paper: HTMLElement): HTMLElement[] {
  const page = paper.getBoundingClientRect();
  const footerRect = paper.querySelector('.folio')?.getBoundingClientRect();
  const footer = footerRect?.height ? footerRect : undefined;
  return [...paper.querySelectorAll<HTMLElement>(textRegions)].filter(node => {
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const outsidePage = rect.left < page.left - 1 || rect.right > page.right + 1 || rect.top < page.top || rect.bottom > (footer ? footer.top - 3 : page.bottom);
    const bounded = node.matches('.gold-child,.gold-main-label h3,.gold-round-copy h3,.gold-door-copy h3,.gold-step-copy,.gold-formula,.explorer-diploma-name');
    // Crimson's glyph extents can exceed a tight line box by a few pixels.
    const glyphAllowance = Math.max(8, parseFloat(getComputedStyle(node).fontSize) * .35);
    const outsideRegion = bounded && (node.scrollHeight > node.clientHeight + glyphAllowance || node.scrollWidth > node.clientWidth + 2);
    return outsidePage || outsideRegion;
  });
}
