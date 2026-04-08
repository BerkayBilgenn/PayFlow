"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: "relative",
  };

  const inputIconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    color: "#4D5570",
    pointerEvents: "none",
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
    fontFamily: "inherit",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(202,138,4,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(202,138,4,0.1)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        position: "relative",
        overflow: "hidden",
        background: "#06080F",
      }}
    >
      <div className="bg-gradient-mesh" />

      <div
        style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}
        className="animate-fade-in-up"
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              marginBottom: "20px",
              background: "linear-gradient(135deg, rgba(202,138,4,0.2), rgba(202,138,4,0.05))",
              border: "1px solid rgba(202,138,4,0.3)",
              boxShadow: "0 0 50px rgba(202,138,4,0.12)",
            }}
          >
            <Zap style={{ width: 32, height: 32, color: "#CA8A04" }} />
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#F1F3F8",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Pay<span style={{ color: "#CA8A04" }}>Flow</span>
          </h1>
          <p style={{ marginTop: "8px", color: "#7A839A", fontSize: "14px" }}>
            Send &amp; receive payments instantly
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(15, 20, 35, 0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 24px 64px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gold shimmer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(202,138,4,0.35), transparent)",
            }}
          />

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#F1F3F8", marginBottom: "6px" }}>
              Welcome back
            </h2>
            <p style={{ color: "#7A839A", fontSize: "14px" }}>
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="login-email"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#C8CDD8", marginBottom: "8px" }}
              >
                Email address
              </label>
              <div style={inputWrapperStyle}>
                <Mail style={inputIconStyle} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="login-password"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#C8CDD8", marginBottom: "8px" }}
              >
                Password
              </label>
              <div style={inputWrapperStyle}>
                <Lock style={inputIconStyle} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4D5570",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
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

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "14px",
                background: loading
                  ? "rgba(202,138,4,0.4)"
                  : "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
                color: "#0A0E1A",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 200ms ease-out",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? (
                <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "14px",
              color: "#7A839A",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "#CA8A04",
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 150ms",
              }}
            >
              Create one →
            </Link>
          </p>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            color: "#4D5570",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock style={{ width: 13, height: 13 }} />
            <span>256-bit encryption</span>
          </div>
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4D5570", opacity: 0.4 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Shield style={{ width: 13, height: 13 }} />
            <span>SOC 2 Compliant</span>
          </div>
        </div>

        {/* Feature pills */}
        <div
          style={{
            marginTop: "32px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {[
            { icon: Zap, label: "Instant Transfers" },
            { icon: Shield, label: "Bank-grade Security" },
            { icon: Sparkles, label: "Zero Fees" },
          ].map((f, i) => (
            <div
              key={f.label}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${200 + i * 80}ms`,
                background: "rgba(15,20,35,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px",
                padding: "16px 10px",
                textAlign: "center",
              }}
            >
              <f.icon style={{ width: 18, height: 18, color: "#CA8A04", margin: "0 auto 6px", display: "block" }} />
              <span style={{ fontSize: "11px", color: "#7A839A", fontWeight: 500, lineHeight: 1.3 }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
