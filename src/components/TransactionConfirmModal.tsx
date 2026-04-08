"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, X, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";

interface TransactionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  recipientEmail: string;
}

type ModalState = "idle" | "loading" | "success" | "error";

const CORRECT_PIN = "1234";

export default function TransactionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  recipientEmail,
}: TransactionConfirmModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", ""]);
      setModalState("idle");
      setShake(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handlePinChange = useCallback((index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    setPin((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setPin((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    },
    [pin]
  );

  const handleConfirm = async () => {
    const enteredPin = pin.join("");
    if (enteredPin.length < 4) return;

    if (enteredPin !== CORRECT_PIN) {
      setShake(true);
      setModalState("error");
      setPin(["", "", "", ""]);
      setTimeout(() => {
        setShake(false);
        setModalState("idle");
        inputRefs.current[0]?.focus();
      }, 1200);
      return;
    }

    setModalState("loading");
    try {
      await onConfirm();
      setModalState("success");
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch {
      setModalState("error");
      setTimeout(() => setModalState("idle"), 1500);
    }
  };

  // Auto-submit when all 4 digits entered
  useEffect(() => {
    if (pin.every((d) => d !== "") && modalState === "idle") {
      handleConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (!isOpen) return null;

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amt);

  const isSuccess = modalState === "success";
  const isLoading = modalState === "loading";
  const isError = modalState === "error";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="animate-scale-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "28px",
          padding: "40px 32px 36px",
          background: "rgba(12, 16, 30, 0.95)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
          textAlign: "center",
          animation: shake ? "shake 0.4s ease-in-out" : undefined,
        }}
      >
        {/* Top gold shimmer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(202,138,4,0.5), transparent)",
          }}
        />

        {/* Close button */}
        {!isLoading && !isSuccess && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#7A839A",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "all 200ms",
            }}
            aria-label="Close"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* ── SUCCESS STATE ── */}
        {isSuccess ? (
          <div className="animate-fade-in-up">
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                background:
                  "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 70%)",
                border: "1px solid rgba(16,185,129,0.35)",
                boxShadow: "0 0 40px rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircle2 style={{ width: 36, height: 36, color: "#10B981" }} />
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#F1F3F8",
                marginBottom: "8px",
              }}
            >
              Transaction Approved!
            </h2>
            <p style={{ color: "#7A839A", fontSize: "14px" }}>
              {formatAmount(amount)} is on its way.
            </p>
          </div>
        ) : (
          <>
            {/* Shield Icon */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                background:
                  "linear-gradient(135deg, rgba(202,138,4,0.18), rgba(202,138,4,0.05))",
                border: "1px solid rgba(202,138,4,0.3)",
                boxShadow: "0 0 40px rgba(202,138,4,0.15)",
              }}
            >
              {isLoading ? (
                <Loader2
                  style={{ width: 32, height: 32, color: "#CA8A04" }}
                  className="animate-spin"
                />
              ) : (
                <Shield style={{ width: 32, height: 32, color: "#CA8A04" }} />
              )}
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#F1F3F8",
                marginBottom: "6px",
                letterSpacing: "-0.02em",
              }}
            >
              Confirm Transaction
            </h2>
            <p style={{ color: "#7A839A", fontSize: "14px", marginBottom: "28px" }}>
              Paying{" "}
              <span style={{ color: "#C8CDD8", fontWeight: 600 }}>
                {formatAmount(amount)}
              </span>{" "}
              to{" "}
              <span
                style={{
                  color: "#CA8A04",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  maxWidth: "200px",
                  verticalAlign: "bottom",
                }}
              >
                {recipientEmail}
              </span>
            </p>

            {/* PIN Label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginBottom: "16px",
              }}
            >
              <Lock style={{ width: 13, height: 13, color: "#4D5570" }} />
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#4D5570", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Enter Security Code
              </p>
            </div>

            {/* PIN Inputs */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  id={`pin-digit-${i}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={isLoading}
                  style={{
                    width: "60px",
                    height: "68px",
                    textAlign: "center",
                    fontSize: "28px",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    background: isError
                      ? "rgba(239,68,68,0.1)"
                      : digit
                      ? "rgba(202,138,4,0.1)"
                      : "rgba(10, 14, 26, 0.7)",
                    border: isError
                      ? "1.5px solid rgba(239,68,68,0.5)"
                      : digit
                      ? "1.5px solid rgba(202,138,4,0.45)"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    color: "#F1F3F8",
                    outline: "none",
                    transition: "all 200ms ease-out",
                    caretColor: "transparent",
                    boxShadow: digit
                      ? "0 0 0 3px rgba(202,138,4,0.12)"
                      : "none",
                  }}
                  onFocus={(e) => {
                    if (!isError) {
                      e.target.style.borderColor = "rgba(202,138,4,0.5)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(202,138,4,0.12)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!digit && !isError) {
                      e.target.style.borderColor = "rgba(255,255,255,0.08)";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                />
              ))}
            </div>

            {/* Error message */}
            {isError && (
              <div
                className="animate-fade-in-up"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#FCA5A5",
                  marginBottom: "12px",
                }}
              >
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>Incorrect code. Please try again.</span>
              </div>
            )}

            {/* Demo hint */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "10px",
                background: "rgba(202,138,4,0.08)",
                border: "1px solid rgba(202,138,4,0.15)",
                marginBottom: "28px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#A16207", fontWeight: 500 }}>
                Demo code:
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#CA8A04",
                  letterSpacing: "0.2em",
                }}
              >
                1234
              </span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={isLoading || pin.some((d) => !d)}
              id="confirm-pay-btn"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "15px",
                background:
                  isLoading || pin.some((d) => !d)
                    ? "rgba(202,138,4,0.35)"
                    : "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
                color: "#0A0E1A",
                fontSize: "15px",
                fontWeight: 700,
                border: "none",
                borderRadius: "14px",
                cursor: isLoading || pin.some((d) => !d) ? "not-allowed" : "pointer",
                transition: "all 200ms ease-out",
                letterSpacing: "0.02em",
                boxShadow:
                  !isLoading && pin.every((d) => d)
                    ? "0 8px 32px -8px rgba(202,138,4,0.5)"
                    : "none",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Shield style={{ width: 18, height: 18 }} />
                  Confirm Payment
                </>
              )}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1); }
          15% { transform: translateX(-8px) scale(1.01); }
          30% { transform: translateX(8px) scale(1.01); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
