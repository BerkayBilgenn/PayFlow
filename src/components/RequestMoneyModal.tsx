"use client";

import { useState } from "react";
import {
  X,
  DollarSign,
  Mail,
  FileText,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";
import { validateRecipient, validateAmount } from "@/lib/validation";

interface RequestMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onSubmit: (data: {
    recipientEmail: string;
    amount: number;
    note: string;
  }) => Promise<void>;
}

export default function RequestMoneyModal({
  isOpen,
  onClose,
  currentUserEmail,
  onSubmit,
}: RequestMoneyModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);

    const recipientError = validateRecipient(recipientEmail);
    if (recipientError) {
      setError(recipientError);
      return;
    }

    if (recipientEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      setError("You cannot request money from yourself");
      return;
    }

    const amountError = validateAmount(parsedAmount);
    if (amountError) {
      setError(amountError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ recipientEmail, amount: parsedAmount, note });
      setRecipientEmail("");
      setAmount("");
      setNote("");
      onClose();
    } catch {
      setError("Failed to create request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    paddingLeft: "44px",
    paddingRight: "16px",
    paddingTop: "14px",
    paddingBottom: "14px",
    background: "rgba(10, 14, 26, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    color: "#F1F3F8",
    fontSize: "14px",
    outline: "none",
    transition: "all 200ms ease-out",
    boxSizing: "border-box" as const,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#C8CDD8",
    marginBottom: "8px",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    color: "#4D5570",
    pointerEvents: "none" as const,
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "rgba(202,138,4,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(202,138,4,0.1)";
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="animate-scale-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          borderRadius: "24px",
          padding: "36px 32px",
          background: "rgba(15, 20, 35, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 32px 80px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Top gold shimmer line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(202,138,4,0.4), transparent)",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#F1F3F8", marginBottom: "4px" }}>
              Request Money
            </h2>
            <p style={{ color: "#7A839A", fontSize: "14px" }}>
              Send a payment request via email
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#7A839A",
              cursor: "pointer",
              transition: "all 200ms",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Close modal"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Recipient Email */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="recipient-email" style={labelStyle}>
              Recipient Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail style={iconStyle} />
              <input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="name@example.com"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="amount" style={labelStyle}>
              Amount (USD)
            </label>
            <div style={{ position: "relative" }}>
              <DollarSign style={iconStyle} />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="note" style={labelStyle}>
              Note <span style={{ color: "#4D5570", fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <FileText
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "16px",
                  width: 18,
                  height: 18,
                  color: "#4D5570",
                  pointerEvents: "none",
                }}
              />
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "none" as const,
                  paddingTop: "14px",
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in-up"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                color: "#FCA5A5",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "20px",
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="submit-request"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "14px",
              background: "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
              color: "#0A0E1A",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 200ms ease-out",
              letterSpacing: "0.02em",
              marginTop: "8px",
            }}
          >
            {loading ? (
              <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
            ) : (
              <>
                <Send style={{ width: 18, height: 18 }} />
                Send Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
