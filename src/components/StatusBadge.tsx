"use client";

import { PaymentStatus } from "@/lib/types";
import { CheckCircle2, Clock, XCircle, TimerOff, Ban } from "lucide-react";

interface StatusBadgeProps {
  status: PaymentStatus;
}

const config: Record<
  PaymentStatus,
  { label: string; icon: React.ElementType; bgStyle: string; borderStyle: string; textClass: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    bgStyle: "rgba(245,158,11,0.1)",
    borderStyle: "rgba(245,158,11,0.2)",
    textClass: "text-pending-text",
  },
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    bgStyle: "rgba(16,185,129,0.1)",
    borderStyle: "rgba(16,185,129,0.2)",
    textClass: "text-paid-text",
  },
  DECLINED: {
    label: "Declined",
    icon: XCircle,
    bgStyle: "rgba(239,68,68,0.1)",
    borderStyle: "rgba(239,68,68,0.2)",
    textClass: "text-declined-text",
  },
  EXPIRED: {
    label: "Expired",
    icon: TimerOff,
    bgStyle: "rgba(107,114,128,0.1)",
    borderStyle: "rgba(107,114,128,0.2)",
    textClass: "text-expired-text",
  },
  CANCELED: {
    label: "Canceled",
    icon: Ban,
    bgStyle: "rgba(107,114,128,0.1)",
    borderStyle: "rgba(107,114,128,0.2)",
    textClass: "text-canceled-text",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, icon: Icon, bgStyle, borderStyle, textClass } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${textClass}`}
      style={{
        background: bgStyle,
        border: `1px solid ${borderStyle}`,
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
