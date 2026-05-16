import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  // Usar o caminho direto da raiz garante que o Vite ache o SVG na pasta public, funcionando no Render
  return (
    <img
      src="/clickreserva_final2.svg"
      alt="ClickReserva"
      className={cn("h-auto w-full object-contain", className)} 
    />
  );
}
