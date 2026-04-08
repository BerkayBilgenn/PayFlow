"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl"
        style={{
          background: "rgba(15, 20, 35, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${isSuccess ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          boxShadow: `var(--shadow-card-hover), 0 0 20px ${isSuccess ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}`,
        }}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-success-text" />
        ) : (
          <XCircle className="w-5 h-5 shrink-0 text-danger-text" />
        )}
        <span className={`text-sm font-medium ${isSuccess ? "text-success-text" : "text-danger-text"}`}>
          {message}
        </span>
        <button
          onClick={onClose}
          className="ml-2 p-1.5 rounded-lg cursor-pointer transition-all duration-200 text-muted hover:text-foreground"
          style={{
            background: "rgba(255,255,255,0.04)",
          }}
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
