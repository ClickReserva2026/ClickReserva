import { useAuth } from "@/contexts/auth-context";
import { ESCOLA } from "@/escola.config";

// ─── Types ───────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}

// ─── Icons ───────────────────────────────────────────────────────
const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CalSmallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Logo padrão ClickReserva (igual ao sidebar) ─────────────────
function BrandLogo() {
  const iconSize = 52;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: iconSize, height: iconSize, flexShrink: 0 }}>
        <div style={{
          width: iconSize, height: iconSize,
          background: "rgba(255,255,255,0.18)",
          borderRadius: iconSize * 0.27,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <svg width={iconSize * 0.7} height={iconSize * 0.7} viewBox="0 0 48 48" fill="none">
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
        <svg style={{ position: "absolute", bottom: -6, right: -8 }}
          width={iconSize * 0.32} height={iconSize * 0.38} viewBox="0 0 24 28" fill="none">
          <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z"
            fill="white" stroke="#064e3b" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1, display: "block" }}>Click</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 26, fontWeight: 900, color: "#6ee7b7", lineHeight: 1, display: "block" }}>Reserva</span>
      </div>
    </div>
  );
}

// ─── Data atual formatada ─────────────────────────────────────────
function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Usuário";
  const today = getFormattedDate();

  const stats: StatCard[] = [
    {
      label: "Total de Reservas Hoje",
      value: 0,
      sub: "0 nesta semana",
      icon: <CalSmallIcon />,
    },
    {
      label: "Salas Ativas",
      value: 6,
      sub: "de 6 cadastradas",
      icon: <MonitorIcon />,
    },
    {
      label: "Pendentes de Aprovação",
      value: 2,
      sub: "aguardando revisão",
      icon: <ClockIcon />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Hero Card ── */}
      <div style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(145deg, #059669 0%, #047857 55%, #065f46 100%)",
        boxShadow: "0 8px 24px rgba(5, 150, 105, 0.28)",
        position: "relative",
      }}>
        {/* Círculos decorativos */}
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -25, left: -25,
          width: 110, height: 110, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />

        <div style={{ padding: "24px 22px 22px", position: "relative" }}>

          {/* Logo padrão */}
          <div style={{ marginBottom: 16 }}>
            <BrandLogo />
          </div>

          {/* Nome da escola */}
          <p style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}>
            {ESCOLA.nome}
          </p>

          {/* Slogan */}
          <p style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: 12, fontStyle: "italic", fontWeight: 600,
            margin: "0 0 16px",
          }}>
            "Tecnologia que Organiza, Escola que Avança"
          </p>

          {/* Divisor */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.15)", marginBottom: 14 }} />

          {/* Saudação + data */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <p style={{ color: "#a7f3d0", fontSize: 13, margin: 0, fontWeight: 500 }}>
              Olá,{" "}
              <strong style={{ color: "white", fontWeight: 800 }}>
                {firstName}
              </strong>
              !{" "}
              <span style={{ color: "rgba(255,255,255,0.72)" }}>
                Aqui está o resumo das suas atividades.
              </span>
            </p>
            <p style={{
              color: "rgba(255,255,255,0.50)",
              fontSize: 11, margin: 0, fontWeight: 500,
              textTransform: "capitalize",
            }}>
              {today}
            </p>
          </div>
        </div>
      </div>

      {/* ── Cards de estatísticas ── */}
      <div className="flex flex-col gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl flex items-center justify-between"
            style={{
              padding: "18px 20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              borderLeft: "4px solid #059669",
            }}
          >
            <div>
              <p className="text-slate-500 text-sm font-semibold mb-1">{s.label}</p>
              <p style={{ color: "#111827", fontSize: 32, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>
                {s.value}
              </p>
              <p className="text-slate-400 text-xs font-medium mt-0.5">{s.sub}</p>
            </div>
            <div style={{
              background: "#ecfdf5", color: "#059669",
              borderRadius: 12, width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
