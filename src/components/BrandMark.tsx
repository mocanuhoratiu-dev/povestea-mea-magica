type BrandMarkProps = {
  className?: string;
  tone?: "ink" | "paper";
  title?: string;
};

export default function BrandMark({ className = "", tone = "ink", title }: BrandMarkProps) {
  const stroke = tone === "paper" ? "#FFF9EE" : "#24324F";

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
    >
      {title ? <title>{title}</title> : null}
      <path d="M22 18c0-11 20-11 20 0" stroke="#E5B84F" strokeLinecap="round" strokeWidth="3.5" />
      <path d="M17 22h30l5 8-4 26c-.5 3.8-3.8 6-7.5 6h-17c-3.7 0-7-2.2-7.5-6l-4-26z" fill={stroke} stroke="#E5B84F" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M22 32h20v18H22z" fill="#F8D36D" />
      <path d="m32 35 2.3 5.7L40 43l-5.7 2.3L32 51l-2.3-5.7L24 43l5.7-2.3z" fill="#8052A0" />
      <path d="M15 31h36M17 56h30" stroke="#E5B84F" strokeLinecap="round" strokeWidth="2.5" />
      <path d="M50 25c5-2.5 8-5.5 10-9M50 31c5.5.2 9-1.2 12-4M14 37c-4 1.7-7 4.5-9 8" stroke="#E5B84F" strokeLinecap="round" strokeWidth="2" />
      <path d="m58 10 1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2zM8 45l.9 2.2 2.2.9-2.2.9L8 51.2 7.1 49 5 48.1l2.1-.9z" fill="#E5B84F" />
    </svg>
  );
}
