import Image from "next/image";
const items = [
  {
    name: "Povestea Magică",
    detail: "Cartea + caietul de activități",
    image: "/examples/album/collection/coperta.webp",
  },
  {
    name: "Atelierul Scutului Magic",
    detail: "Ritualul vostru de seară",
    image: "/examples/kits-v2/atelier-preview.webp",
  },
  {
    name: "Dosarul Micului Explorator",
    detail: "Un mister de rezolvat împreună",
    image: "/examples/kits-v2/explorer-preview.webp",
  },
];
export default function CollectionOverview() {
  return (
    <div className="bg-white border-y border-brand-navy/10">
      <div className="collection-strip">
        {items.map((item) => (
          <figure key={item.name}>
            <Image
              src={item.image}
              alt={item.name}
              width={650}
              height={850}
              sizes="(max-width:640px) 30vw, 300px"
            />
            <figcaption>{item.name}</figcaption>
            <p>{item.detail}</p>
          </figure>
        ))}
      </div>
    </div>
  );
}
