import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  columns?: 1 | 2;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  columns = 1,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn("space-y-3.5", className)}>
      {(title || description) && (
        <div className="border-b border-border/70 pb-2.5">
          {title && (
            <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>{children}</div>
    </section>
  );
}
