"use client";

import { Wallet, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  balance: number | null;
  userEmail: string;
  loading?: boolean;
}

export default function WalletCard({ balance, userEmail, loading }: WalletCardProps) {
  const [hidden, setHidden] = useState(false);

  const formatted =
    balance === null
      ? "—"
      : hidden
      ? "••••••"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(balance);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <div className="wallet-card">
      {/* Shimmer line top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(202,138,4,0.6) 40%, rgba(234,179,8,0.8) 55%, rgba(202,138,4,0.6) 70%, transparent 100%)",
        }}
      />

      {/* Background pattern — subtle chip-like orbs */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(202,138,4,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "30%",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(202,138,4,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top row: logo + toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(202,138,4,0.15)",
              border: "1px solid rgba(202,138,4,0.3)",
            }}
          >
            <Wallet style={{ width: 16, height: 16, color: "#CA8A04" }} />
          </div>
          <span
            style={{ fontSize: "13px", fontWeight: 700, color: "#FDE68A", letterSpacing: "0.04em" }}
          >
            PayFlow Wallet
          </span>
        </div>

        <button
          onClick={() => setHidden((v) => !v)}
          title={hidden ? "Show balance" : "Hide balance"}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#7A839A",
            transition: "all 200ms",
          }}
        >
          {hidden ? <Eye style={{ width: 16, height: 16 }} /> : <EyeOff style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#7A839A",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Available Balance
        </p>
        {loading ? (
          <div
            style={{
              height: "36px",
              width: "180px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ) : (
          <p className="wallet-balance">
            {formatted}
          </p>
        )}
      </div>

      {/* Bottom row: avatar + chips */}
      <div className="wallet-bottom">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 800,
              background: "linear-gradient(135deg, rgba(202,138,4,0.25), rgba(202,138,4,0.08))",
              border: "1px solid rgba(202,138,4,0.3)",
              color: "#FDE68A",
            }}
          >
            {initial}
          </div>
          <span className="wallet-email">
            {userEmail}
          </span>
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["ACTIVE", "INSURED"].map((chip) => (
            <div
              key={chip}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                fontSize: "10px",
                fontWeight: 700,
                color: "#4D5570",
                letterSpacing: "0.08em",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
