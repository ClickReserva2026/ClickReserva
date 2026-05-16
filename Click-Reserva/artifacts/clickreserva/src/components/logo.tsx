import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  // Garante o caminho correto se o app rodar em subpastas
  const base = typeof window !== "undefined" ? (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") : "";
  
  return (
    <img
      src={`${base}/clickreserva_final2.svg`}
      alt="ClickReserva"
      className={cn("h-auto w-full object-contain", className)} 
    />
  );
}
