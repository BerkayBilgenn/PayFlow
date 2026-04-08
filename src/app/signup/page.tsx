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
  User as UserIcon,
  Shield,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(authError.message);
        }
        return;
      }

      // Email confirmation is disabled in Supabase, so we should have a session
      if (data.session) {
        router.push("/dashboard");
      } else {
        // Fallback: try signing in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("Account created! Please sign in.");
          router.push("/login");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
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
    fontFamily: "inherit",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    color: "#4D5570",
    pointerEvents: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#C8CDD8",
    marginBottom: "8px",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(202,138,4,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(202,138,4,0.1)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.08)";
    e.target.style.boxShadow = "none";
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Too short", color: "#EF4444", width: "25%" };
    if (password.length < 8) return { label: "Weak", color: "#F97316", width: "50%" };
    if (password.length < 12) return { label: "Good", color: "#EAB308", width: "75%" };
    return { label: "Strong", color: "#10B981", width: "100%" };
  };

  const strength = passwordStrength();

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
        style={{ width: "100%", maxWidth: "460px", position: "relative", zIndex: 10 }}
        className="animate-fade-in-up"
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              marginBottom: "18px",
              background: "linear-gradient(135deg, rgba(202,138,4,0.2), rgba(202,138,4,0.05))",
              border: "1px solid rgba(202,138,4,0.3)",
              boxShadow: "0 0 50px rgba(202,138,4,0.12)",
            }}
          >
            <Zap style={{ width: 30, height: 30, color: "#CA8A04" }} />
          </div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#F1F3F8",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Pay<span style={{ color: "#CA8A04" }}>Flow</span>
          </h1>
          <p style={{ marginTop: "6px", color: "#7A839A", fontSize: "14px" }}>
            Create your free account
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
            padding: "36px 32px",
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
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#F1F3F8", marginBottom: "4px" }}>
              Create your account
            </h2>
            <p style={{ color: "#7A839A", fontSize: "14px" }}>
              Start sending payments in seconds
            </p>
          </div>

          <form onSubmit={handleSignUp}>
            {/* Full Name */}
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="signup-name" style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <UserIcon style={iconStyle} />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="signup-email" style={labelStyle}>Email address</label>
              <div style={{ position: "relative" }}>
                <Mail style={iconStyle} />
                <input
                  id="signup-email"
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
            <div style={{ marginBottom: "8px" }}>
              <label htmlFor="signup-password" style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock style={iconStyle} />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4D5570", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {strength && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#4D5570" }}>Password strength</span>
                  <span style={{ fontSize: "11px", color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "2px",
                      width: strength.width,
                      background: strength.color,
                      transition: "all 300ms ease-out",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="signup-confirm" style={labelStyle}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock style={iconStyle} />
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  style={{
                    ...inputStyle,
                    paddingRight: "44px",
                    borderColor: confirmPassword && password !== confirmPassword
                      ? "rgba(239,68,68,0.4)"
                      : confirmPassword && password === confirmPassword
                      ? "rgba(16,185,129,0.4)"
                      : "rgba(255,255,255,0.08)",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4D5570", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
                {/* Match indicator */}
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 style={{
                    position: "absolute",
                    right: "40px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#10B981",
                  }} />
                )}
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
              id="signup-submit"
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
                  Create Account
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#7A839A" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "#CA8A04", fontWeight: 600, textDecoration: "none" }}
            >
              Sign in →
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div
          style={{
            marginTop: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            color: "#4D5570",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Shield style={{ width: 13, height: 13 }} />
            <span>Bank-grade security</span>
          </div>
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4D5570", opacity: 0.4 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </main>
  );
}
