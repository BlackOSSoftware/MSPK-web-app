import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  showText = true,
  titleClassName,
  subtitleClassName,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative h-11 w-11 overflow-hidden rounded-xl border border-border/70 bg-foreground/[0.03] dark:bg-background/70", imageClassName)}>
        <Image
          src="/logo.jpg"
          alt="MSPK Trade Solutions logo"
          fill
          sizes="44px"
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <div className="leading-none">
          <p className={cn("font-heading text-lg font-extrabold tracking-tight text-foreground", titleClassName)}>MSPK</p>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.2em] text-primary", subtitleClassName)}>Trade Solutions</p>
        </div>
      )}
    </div>
  );
}
