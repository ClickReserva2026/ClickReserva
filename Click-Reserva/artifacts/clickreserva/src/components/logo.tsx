import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Ícone */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div style={{
          width: 56, height: 56,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="10" width="40" height="34" rx="6" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="4" y="10" width="40" height="13" rx="6" fill="rgba(255,255,255,0.28)"/>
            <line x1="4" y1="23" x2="44" y2="23" stroke="white" strokeWidth="1.2" strokeOpacity="0.3"/>
            <rect x="14" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="30" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="7"  y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="27" width="6" height="5" rx="1.5" fill="white"/>
            <rect x="25" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="7"  y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="25" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        {/* Cursor */}
        <svg style={{ position: "absolute", bottom: -7, right: -9 }} width="16" height="20" viewBox="0 0 24 28" fill="none">
          <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z" fill="white" stroke="#064e3b" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* Nome */}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, display: "block" }}>Click</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, color: "#6ee7b7", lineHeight: 1, display: "block" }}>Reserva</span>
      </div>
      {/* Tagline */}
      <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.5)", letterSpacing: "1.2px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.5 }}>
        Tecnologia que organiza,<br/>escola que avança
      </span>
    </div>
  );
}
