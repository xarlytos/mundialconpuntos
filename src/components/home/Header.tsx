import { useState } from "react";
import { Settings } from "lucide-react";

interface HeaderProps {
  points: number;
}

export const Header = ({ points }: HeaderProps) => {
  const [language, setLanguage] = useState<"ES" | "EN">("ES");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ES" ? "EN" : "ES"));
  };

  return (
    <div
      style={{
        background: "rgba(26, 29, 41, 0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "var(--space-2) var(--space-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Logo a la izquierda */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #FFE600 0%, #FFD700 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          ⚽
        </div>
        <span
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-black)",
            color: "#ffffff",
          }}
        >
          App Mundial de Fútbol 2026
        </span>
      </div>

      {/* Controles a la derecha */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        {/* Selector de idioma */}
        <button
          onClick={toggleLanguage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 8px",
            background: "#262937",
            borderRadius: "var(--radius-md)",
            border: "1px solid #2f3242",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#FFE600";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2f3242";
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-bold)",
              color: "#FFE600",
            }}
          >
            {language}
          </span>
        </button>

        {/* Puntos */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "4px",
            padding: "4px 10px",
            background: "#1a1a24",
            borderRadius: "var(--radius-md)",
            border: "1px solid #2a2a3a",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: "var(--font-black)",
              color: "#FFE600",
            }}
          >
            {points}
          </span>
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-bold)",
              color: "#a0a0b0",
              letterSpacing: "0.5px",
            }}
          >
            PTS
          </span>
        </div>

        {/* Settings */}
        <button
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#262937",
            border: "1px solid #2f3242",
            borderRadius: "var(--radius-md)",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};
