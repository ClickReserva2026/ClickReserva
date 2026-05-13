export function Logo({ className }: { className?: string }) {
  const base = typeof window !== "undefined" ? (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") : "";
  return (
    <img
      src={`${base}/logo.png`}
      alt="ClickReserva"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
