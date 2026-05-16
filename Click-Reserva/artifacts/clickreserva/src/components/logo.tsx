import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const base = typeof window !== "undefined" ? (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") : "";
  
  return (
    <img
      src={`${base}/logo.png`}
      alt="ClickReserva"
      className={cn("h-10 md:h-12 w-auto object-contain max-w-full transition-all duration-200", className)}
    />
  );
}
