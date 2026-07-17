"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const examples = [
  {
    title: "Poveste personalizată",
    image: "/examples/poveste-contact.png",
    description: "Copertă, dedicație, profilul copilului și pagini de poveste așezate pentru citit seara.",
  },
  {
    title: "Scut Magic pentru Noapte",
    image: "/examples/scut-contact.png",
    description: "Certificat, rețetă de spray simbolic și etichete printabile pentru ritualul de seară.",
  },
  {
    title: "Trusa Magică de Urgență",
    image: "/examples/trusa-contact.png",
    description: "Misiuni rapide, jocuri de răbdare, întrebări și diplomă pentru momentele lungi de așteptare.",
  },
];

export default function ProductExamples() {
  return (
    <section className="bg-brand-cream py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <div className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black uppercase tracking-widest text-brand-purple">
            Materiale gata de generare
          </div>
          <h2 className="mt-5 font-nunito text-4xl md:text-5xl font-extrabold text-brand-navy">
            Descoperă materialele personalizate
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/65">
            Fiecare PDF este creat din alegerile tale și pregătit pentru citit, print sau folosit imediat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {examples.map((example, index) => (
            <motion.article
              key={example.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl border border-brand-navy/5"
            >
              <div className="relative aspect-[4/3] bg-brand-navy/5">
                <Image
                  src={example.image}
                  alt={example.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-7">
                <h3 className="font-nunito text-2xl font-black text-brand-navy">{example.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-brand-navy/60">{example.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
