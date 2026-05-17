import { useAuth } from "@/contexts/auth-context";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="11" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

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

// ─── Component ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();

  // Mapeia role para label amigável em português
  const roleLabel: Record<string, string> = {
    coordinator: "Coordenador",
    admin:       "Administrador",
    teacher:     "Professor",
    student:     "Aluno",
  };

  const greeting = user ? (roleLabel[user.role] ?? user.role) : "Usuário";

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
    <div className="min-h-screen bg-background">

      {/* ── Hero Card ── */}
      <div style={{
        margin: "16px 16px 0",
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(145deg, #059669 0%, #047857 50%, #065f46 100%)",
        boxShadow: "0 8px 24px rgba(5, 150, 105, 0.30)",
        position: "relative",
      }}>
        {/* Círculos decorativos */}
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 130, height: 130, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20,
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }} />

        <div style={{ padding: "24px 22px 22px", position: "relative" }}>

          {/* Ícone + rótulo do sistema */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              borderRadius: 14,
              width: 50,
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "white",
            }}>
              <CalendarIcon />
            </div>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.6,
            }}>
              Sistema de Agendamento<br />de Laboratórios
            </p>
          </div>

          {/* Título principal */}
          <h1 style={{
            color: "white",
            fontSize: 30,
            fontWeight: 900,
            margin: "0 0 4px",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}>
            Click<span style={{ color: "#6ee7b7" }}>Reserva</span>
          </h1>

          {/* Slogan */}
          <p style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: 12,
            fontStyle: "italic",
            fontWeight: 600,
            margin: "0 0 16px",
          }}>
            "Tecnologia que Organiza, Escola que Avança"
          </p>

          {/* Divisor */}
          <div style={{
            height: 1,
            background: "rgba(255,255,255,0.15)",
            marginBottom: 14,
          }} />

          {/* Saudação dinâmica vinda do contexto de auth */}
          <p style={{ color: "#a7f3d0", fontSize: 13, margin: 0, fontWeight: 500 }}>
            Olá, <strong style={{ color: "white", fontWeight: 800 }}>{greeting}</strong>!{" "}
            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              Aqui está o resumo das suas atividades.
            </span>
          </p>
        </div>
      </div>

      {/* ── Cards de estatísticas ── */}
      <div style={{ padding: "14px 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "white",
            borderRadius: 16,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            borderLeft: "4px solid #059669",
          }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
                {s.label}
              </p>
              <p style={{ color: "#111827", fontSize: 32, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, fontWeight: 500 }}>
                {s.sub}
              </p>
            </div>
            <div style={{
              background: "#ecfdf5",
              color: "#059669",
              borderRadius: 12,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
