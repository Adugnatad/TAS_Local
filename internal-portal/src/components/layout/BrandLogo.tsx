import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function BrandLogo({ className, imageClassName, priority = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center rounded-md bg-black p-2", className)}>
      <Image
        src="/brand/coop-logo.png"
        alt="COOP Bank of Oromia"
        width={480}
        height={192}
        priority={priority}
        className={cn("h-auto w-auto object-contain", imageClassName)}
      />
    </span>
  );
}
