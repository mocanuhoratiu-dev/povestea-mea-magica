"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
export default function FinalStoryCTA() {
  return (
    <section
      className="final-story-band px-5 sm:px-6"
      aria-labelledby="final-cta-title"
    >
      <div className="mx-auto max-w-6xl">
        <div>
          <p>Un copil. O lume numai a lui.</p>
          <h2 id="final-cta-title">Următoarea poveste e a lui.</h2>
        </div>
        <div className="final-story-actions">
          <Link
            href="/povestea-magica#configureaza-albumul"
            className="editorial-button"
          >
            Creează Povestea Magică <ArrowRight size={18} />
          </Link>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("pmm:lumi-open"))
            }
          >
            <Sparkles size={17} /> Creează cu Lumi
          </button>
        </div>
      </div>
    </section>
  );
}
