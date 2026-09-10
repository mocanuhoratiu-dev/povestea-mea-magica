import Image from "next/image";
export default function PersonalizationProof() {
  return (
    <section
      className="px-5 sm:px-6 bg-white"
      aria-labelledby="personalization-title"
    >
      <div className="personal-proof mx-auto max-w-7xl">
        <div>
          <p className="text-brand-purple text-xs">De la detalii la personaj</p>
          <h2 id="personalization-title">
            Nu doar numele.
            <br />
            Chiar lumea lui.
          </h2>
          <p>
            Tu ne spui cum arată și ce îl bucură. Noi construim personajul și
            aventura în jurul acestor detalii.
          </p>
          <dl>
            <div>
              <dt>Eroina</dt>
              <dd>Eva, 5 ani</dd>
            </div>
            <div>
              <dt>Portretul</dt>
              <dd>Păr șaten, ondulat</dd>
            </div>
            <div>
              <dt>Un detaliu al ei</dt>
              <dd>Rucsacul cu stele</dd>
            </div>
            <div>
              <dt>Aventura</dt>
              <dd>O steluță de ajutat</dd>
            </div>
          </dl>
          <p>Fotografia este opțională. Poți începe doar cu o descriere.</p>
        </div>
        <figure>
          <Image
            src="/examples/album/collection/aventura.webp"
            alt="Eva și steluța, într-o pagină interioară din povestea demonstrativă"
            width={1260}
            height={888}
            sizes="(max-width:700px) 94vw, 48vw"
          />
          <figcaption>
            Eva și lumina dintre stele · pagină din modelul ilustrat
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
