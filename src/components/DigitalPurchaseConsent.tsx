"use client";

import Link from "next/link";
import { TicketPercent } from "lucide-react";

type DigitalPurchaseConsentProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  productLabel: string;
  error?: string;
};

export default function DigitalPurchaseConsent({ checked, onCheckedChange, productLabel, error = "" }: DigitalPurchaseConsentProps) {
  return (
    <fieldset className="border-y border-brand-navy/15 py-4" aria-describedby={error ? "digital-purchase-consent-error" : undefined}>
      <label className="flex cursor-pointer items-start gap-3 text-left text-sm font-semibold leading-relaxed text-brand-navy/75">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-brand-purple"
        />
        <span>
          Solicit pregătirea și livrarea imediată a materialului digital personalizat „{productLabel}” după confirmarea plății. Înțeleg că, după începerea furnizării, dreptul de retragere poate fi pierdut în condițiile legii.
          {" "}
          <Link href="/termeni-si-conditii" className="font-black text-brand-purple underline underline-offset-2">Vezi termenii</Link>
          {" și "}
          <Link href="/politica-de-rambursare" className="font-black text-brand-purple underline underline-offset-2">politica de rambursare</Link>.
        </span>
      </label>
      <p className="mt-3 flex items-center gap-2 text-left text-sm font-bold text-brand-purple">
        <TicketPercent size={17} aria-hidden="true" />
        Ai un cod de reducere? Îl poți introduce în pasul următor, în pagina securizată de plată.
      </p>
      {error && <p id="digital-purchase-consent-error" role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}
    </fieldset>
  );
}
