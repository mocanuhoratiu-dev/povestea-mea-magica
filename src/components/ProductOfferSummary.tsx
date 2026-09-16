import { BookOpen, Eye, Mail, UserRound } from "lucide-react";
import { offerFacts, type OfferProduct } from "@/lib/productOffer";

const icons = [Mail, BookOpen, UserRound, Eye];

export default function ProductOfferSummary({ product, price, compact = false, className = "" }: {
  product: OfferProduct;
  price?: string;
  compact?: boolean;
  className?: string;
}) {
  return <div className={`product-offer-summary ${compact ? "offer-compact" : ""} ${className}`} data-offer-product={product} data-lumi-obstacle>
    {price && <div className="offer-price"><strong>{price}</strong><span>Ediția digitală · o singură plată</span></div>}
    <dl className="offer-facts">{offerFacts(product).map((fact, index) => {
      const Icon = icons[index];
      return <div key={fact.label}><dt><Icon size={17} aria-hidden="true" />{fact.label}</dt><dd>{fact.text}</dd></div>;
    })}</dl>
  </div>;
}
