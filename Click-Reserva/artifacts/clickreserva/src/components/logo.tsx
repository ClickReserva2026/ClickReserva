import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark"; // light = para fundo branco, dark = para fundo verde
}

export function Logo({ className, variant = "dark" }: LogoProps) {
  const isLight = variant === "light";
  const clickColor  = isLight ? "#064e3b" : "#ffffff";
  const reservaColor = "#6ee7b7";
  const iconBg = isLight ? "rgba(6,78,59,0.10)" : "rgba(255,255,255,0.18)";
  const iconBorder = isLight ? "rgba(6,78,59,0.20)" : "rgba(255,255,255,0.25)";
  const svgStroke = isLight ? "#064e3b" : "white";
  const svgFill   = isLight ? "#064e3b" : "white";
  const cursorStroke = "#064e3b";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Ícone calendário */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          width: 64, height: 64,
          background: iconBg,
          borderRadius: 17,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${iconBorder}`,
        }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="10" width="40" height="34" rx="6" fill="none" stroke={svgStroke} strokeWidth="2"/>
            <rect x="4" y="10" width="40" height="13" rx="6" fill={isLight ? "rgba(6,78,59,0.15)" : "rgba(255,255,255,0.28)"}/>
            <line x1="4" y1="23" x2="44" y2="23" stroke={svgStroke} strokeWidth="1.2" strokeOpacity="0.3"/>
            <rect x="14" y="4" width="4" height="11" rx="2" fill={svgFill} fillOpacity="0.85"/>
            <rect x="30" y="4" width="4" height="11" rx="2" fill={svgFill} fillOpacity="0.85"/>
            <rect x="7"  y="27" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="16" y="27" width="6" height="5" rx="1.5" fill={svgFill}/>
            <rect x="25" y="27" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="34" y="27" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="7"  y="35" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="16" y="35" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="25" y="35" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
            <rect x="34" y="35" width="6" height="5" rx="1.5" fill={svgFill} fillOpacity="0.4"/>
          </svg>
        </div>
        {/* Cursor */}
        <svg style={{ position: "absolute", bottom: -8, right: -10 }} width="20" height="24" viewBox="0 0 24 28" fill="none">
          <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z"
            fill={isLight ? "#10b981" : "white"} stroke={cursorStroke} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Nome */}
      <div style={{ textAlign: "center" }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 34, fontWeight: 900,
          color: clickColor, lineHeight: 1, display: "block",
        }}>Click</span>
        <span style={{
          fontFamily: "'Nunito', sans-serif", fontSize: 34, fontWeight: 900,
          color: reservaColor, lineHeight: 1, display: "block",
        }}>Reserva</span>
      </div>

      {/* Tagline */}
      <span style={{
        fontSize: 9,
        color: isLight ? "rgba(6,78,59,0.5)" : "rgba(255,255,255,0.5)",
        letterSpacing: "1.2px", textTransform: "uppercase",
        textAlign: "center", lineHeight: 1.5,
      }}>
        Tecnologia que organiza,<br/>escola que avança
      </span>
    </div>
  );
}
