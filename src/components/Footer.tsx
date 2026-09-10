"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { legalOperator } from "@/lib/publicContact";

type SocialIconProps = { className?: string };

function InstagramIcon({ className = "" }: SocialIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.45" cy="6.7" r="1.05" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className = "" }: SocialIconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.65 21v-8.2h2.78l.42-3.22h-3.2V7.53c0-.93.26-1.57 1.6-1.57h1.7V3.08c-.3-.04-1.3-.13-2.48-.13-2.46 0-4.15 1.5-4.15 4.27v2.36H7.54v3.22h2.78V21h3.33Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "Instagram", handle: "@povesteameamagica", href: "https://www.instagram.com/povesteameamagica/", Icon: InstagramIcon },
  { label: "Facebook", handle: "Povestea Mea Magică", href: "https://www.facebook.com/povesteameamagica", Icon: FacebookIcon },
] as const;

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M14.2 3.5c.35 2.36 1.68 3.77 4.3 3.92v3.02a7.35 7.35 0 0 1-4.26-1.37v6.1a5.67 5.67 0 1 1-4.9-5.62v3.08a2.63 2.63 0 1 0 1.84 2.5V3.5h3.02Z" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-brand-navy px-6 pb-10 pt-20 text-brand-cream">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-brand-cream/15 pb-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
          <div>
            <Link href="/" className="flex w-fit items-center gap-3">
              <BrandMark className="h-11 w-11" tone="paper" />
              <span className="font-serif text-2xl leading-none">Povestea Mea <span className="text-brand-gold italic">Magică</span></span>
            </Link>
            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-brand-cream/70">Povești ilustrate și ritualuri create cu grijă pentru copilul și momentele familiei tale.</p>
            <div className="mt-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Urmărește povestea</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map(({ label, handle, href, Icon }) => (
                  <a
                    key={label}
                    aria-label={`${label}: ${handle}`}
                    className="group inline-flex h-11 w-11 items-center justify-center border border-brand-cream/20 text-brand-cream transition-colors hover:border-brand-gold hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                    href={href}
                    rel="noreferrer"
                    target="_blank"
                    title={`${label} · ${handle}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
                <a
                  aria-label="TikTok: @povesteameamagica"
                  className="group inline-flex h-11 w-11 items-center justify-center border border-brand-cream/20 text-brand-cream transition-colors hover:border-brand-gold hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                  href="https://www.tiktok.com/@povesteameamagica"
                  rel="noreferrer"
                  target="_blank"
                  title="TikTok · @povesteameamagica"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              </div>
              <p className="mt-3 text-sm font-bold text-brand-cream/60">@povesteameamagica</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Materiale</p>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/povestea-magica" className="transition-colors hover:text-brand-gold">Povestea Magică</Link></li>
              <li><Link href="/scutul-de-noapte" className="transition-colors hover:text-brand-gold">Atelierul Scutului Magic</Link></li>
              <li><Link href="/trusa-de-rabdare" className="transition-colors hover:text-brand-gold">Dosarul Micului Explorator</Link></li>
              <li><Link href="/modele" className="transition-colors hover:text-brand-gold">Răsfoiește modelele</Link></li>
              <li><Link href="/preturi" className="transition-colors hover:text-brand-gold">Prețuri</Link></li>
              <li><Link href="/cum-functioneaza" className="transition-colors hover:text-brand-gold">Cum funcționează</Link></li>
              <li><Link href="/despre" className="transition-colors hover:text-brand-gold">Despre proiect</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Încredere</p>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/politica-de-confidentialitate" className="transition-colors hover:text-brand-gold">Confidențialitate</Link></li>
              <li><Link href="/termeni-si-conditii" className="transition-colors hover:text-brand-gold">Termeni și condiții</Link></li>
              <li><Link href="/politica-de-rambursare" className="transition-colors hover:text-brand-gold">Politică de rambursare</Link></li>
              <li><Link href="/livrare-digitala" className="transition-colors hover:text-brand-gold">Livrare digitală</Link></li>
              <li><Link href="/politica-cookie-uri" className="transition-colors hover:text-brand-gold">Cookie-uri</Link></li>
              <li><button type="button" onClick={() => window.dispatchEvent(new Event("pmm:privacy-settings"))} className="text-left transition-colors hover:text-brand-gold">Preferințe cookie</button></li>
              <li><Link href="/intrebari-frecvente" className="transition-colors hover:text-brand-gold">Întrebări frecvente</Link></li>
              <li><Link href="/siguranta-ai" className="transition-colors hover:text-brand-gold">Siguranța datelor</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-brand-gold">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-8 text-sm font-medium text-brand-cream/65 md:flex-row md:items-center md:justify-between">
          <p>© 2026 {legalOperator.name} · CUI {legalOperator.cui}</p>
          <p>Materiale digitale pentru familii, create pentru momente de folosit împreună.</p>
        </div>
      </div>
    </footer>
  );
}
