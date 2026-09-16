import Image from "next/image";
import { activityComparison } from "@/lib/productOffer";

export default function ActivityComparison() {
  return <section className="activity-comparison" aria-labelledby="activity-comparison-title" data-lumi-obstacle>
    <div className="activity-comparison-inner">
      <h2 id="activity-comparison-title">Două feluri diferite de joacă.</h2>
      <p className="activity-comparison-intro">Caietul prelungește povestea. Dosarul începe o aventură separată, la restaurant, pe drum sau în sala de așteptare. Pachetul Complet le include pe amândouă.</p>
      <div className="activity-comparison-grid">{activityComparison.map(item => <article key={item.title}>
        <Image src={item.image} alt={item.imageAlt} width={300} height={200} sizes="(max-width: 700px) 100px, 160px" />
        <div><h3>{item.title}</h3><p><strong>{item.purpose}</strong></p><p>{item.detail}</p><p className="activity-inclusion">{item.inclusion}</p></div>
      </article>)}</div>
    </div>
  </section>;
}
