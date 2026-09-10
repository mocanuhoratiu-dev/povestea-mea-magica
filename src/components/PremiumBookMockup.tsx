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
  sizes = "(min-width:1024px) 40vw, 90vw",
  className = "",
}: PremiumBookMockupProps) {
  const isSample = src === "/examples/album/collection/coperta.webp";
  return (
    <div className={`relative mx-auto aspect-[1.42] w-full ${className}`}>
      <Image
        src={isSample ? "/examples/album/collection/book-mockup.webp" : src}
        alt={alt}
        fill
        priority={priority}
        quality={85}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  );
}
