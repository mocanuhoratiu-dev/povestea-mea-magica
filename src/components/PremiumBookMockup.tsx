import Image from "next/image";

type PremiumBookMockupProps = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export default function PremiumBookMockup({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 52vw, 94vw",
  className = "",
}: PremiumBookMockupProps) {
  return (
    <div className={`relative isolate mx-auto aspect-[1.48] w-full ${className}`}>
      <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[3%] h-[12%] rounded-[50%] bg-brand-navy/30 blur-xl" />
      <div className="absolute left-[6%] top-[4%] aspect-[1.419] w-[88%] [perspective:1800px]">
        <div className="relative h-full w-full [transform:rotateX(1.2deg)_rotateY(-2.4deg)_rotateZ(-.35deg)] [transform-style:preserve-3d]">
          <div aria-hidden="true" className="absolute -bottom-[3.2%] -right-[1.9%] left-[1.4%] top-[2.2%] border border-brand-navy/35 bg-brand-navy shadow-[18px_24px_45px_rgba(7,24,44,.25)]" />
          <div
            aria-hidden="true"
            className="absolute -bottom-[2%] -right-[1.25%] left-[2.2%] top-[2.5%] border border-[#c8b98f] bg-[#f4ecd7]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(65,54,35,.16) 0,rgba(65,54,35,.16) 1px,transparent 1px,transparent 4px)" }}
          />
          <div className="absolute inset-0 overflow-hidden border-[3px] border-brand-navy bg-brand-navy shadow-[0_18px_35px_rgba(4,12,29,.24)] sm:border-[5px]">
            <Image src={src} alt={alt} fill priority={priority} fetchPriority={priority ? "high" : undefined} quality={80} sizes={sizes} className="object-contain" />
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[4.5%] bg-[linear-gradient(90deg,rgba(2,9,24,.62),rgba(4,12,29,.2)_55%,transparent)]" />
            <div aria-hidden="true" className="absolute inset-y-0 left-[4.6%] w-px bg-white/18" />
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[9%] bg-gradient-to-b from-white/14 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
