import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
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

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  { label: "Início", href: "/" },
  { label: "Minhas Reservas", href: "/reservas" },
  { label: "Salas", href: "/salas" },
  { label: "Calendário", href: "/calendario" },
  { label: "Configurações", href: "/configuracoes" },
  { label: "Sair", href: "/logout" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

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
    <div style={{
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      background: "#f0f4f8",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
    }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: "#065f46",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <CalendarIcon />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 17, display: "block" }}>Click</span>
            <span style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 15 }}>Reserva</span>
          </div>
        </div>

        <div style={{ width: 30 }} />
      </nav>

      {/* ── Dropdown Menu ── */}
      {menuOpen && (
        <div style={{
          position: "absolute",
          top: 58,
          left: 0,
          right: 0,
          background: "#064e3b",
          zIndex: 99,
          padding: "8px 0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}>
          {MENU_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: "block",
                padding: "13px 24px",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      {/* ── Hero Card ── */}
      <div style={{
        margin: "20px 16px 0",
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(145deg, #059669 0%, #047857 50%, #065f46 100%)",
        boxShadow: "0 8px 24px rgba(5, 150, 105, 0.35)",
        position: "relative",
      }}>
        {/* Decorative circles */}
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

        <div style={{ padding: "28px 24px 26px", position: "relative" }}>
          {/* Icon + system label */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              borderRadius: 14,
              width: 52,
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "white",
            }}>
              <CalendarIcon />
            </div>
            <div>
              <p style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
              }}>
                Sistema de Agendamento de
              </p>
              <p style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
              }}>
                Laboratórios
              </p>
            </div>
          </div>

          {/* Main title */}
          <h1 style={{
            color: "white",
            fontSize: 34,
            fontWeight: 900,
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}>
            Click<span style={{ color: "#6ee7b7" }}>Reserva</span>
          </h1>

          {/* Tagline */}
          <p style={{
            color: "rgba(255,255,255,0.80)",
            fontSize: 13,
            fontStyle: "italic",
            fontWeight: 600,
            margin: "0 0 18px",
          }}>
            "Tecnologia que Organiza, Escola que Avança"
          </p>

          {/* Divider */}
          <div style={{
            height: 1,
            background: "rgba(255,255,255,0.15)",
            marginBottom: 16,
          }} />

          {/* Greeting */}
          <p style={{
            color: "#a7f3d0",
            fontSize: 14,
            margin: 0,
            fontWeight: 500,
          }}>
            Olá, <strong style={{ color: "white", fontWeight: 800 }}>Coordenador</strong>!{" "}
            <span style={{ color: "rgba(255,255,255,0.75)" }}>
              Aqui está o resumo das suas atividades.
            </span>
          </p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
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
              <p style={{
                color: "#6b7280",
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 4px",
              }}>
                {s.label}
              </p>
              <p style={{
                color: "#111827",
                fontSize: 32,
                fontWeight: 900,
                margin: "0 0 2px",
                lineHeight: 1,
              }}>
                {s.value}
              </p>
              <p style={{
                color: "#9ca3af",
                fontSize: 12,
                margin: 0,
                fontWeight: 500,
              }}>
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
