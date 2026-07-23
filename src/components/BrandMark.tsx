import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  tone?: "ink" | "paper";
  title?: string;
};

export default function BrandMark({ className = "", title }: BrandMarkProps) {
  return (
    <Image
      aria-hidden={title ? undefined : true}
      alt={title || ""}
      className={`block object-contain ${className}`}
      height={810}
      src="/brand-mark.png"
      width={810}
    />
  );
}
