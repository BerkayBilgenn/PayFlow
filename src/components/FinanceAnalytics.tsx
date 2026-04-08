"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
} from "lucide-react";

interface FinanceDataPoint {
  month: string;
  income: number;
  outgoing: number;
  balance: number;
}

interface FinanceAnalyticsProps {
  incomingPaid: number;
  outgoingPaid: number;
  walletBalance: number | null;
  incomingRequests: { status: string; amount: number; created_at: string }[];
  outgoingRequests: { status: string; amount: number; created_at: string }[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const INITIAL_BALANCE = 50000;

// ── Count-up animation hook ──
function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ── Build real monthly chart data ──
function buildMonthlyData(
  incomingRequests: FinanceAnalyticsProps["incomingRequests"],
  outgoingRequests: FinanceAnalyticsProps["outgoingRequests"],
  walletBalance: number
): FinanceDataPoint[] {
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const months: Record<string, { income: number; outgoing: number }> = {};
  monthKeys.forEach((k) => (months[k] = { income: 0, outgoing: 0 }));

  const addToMonth = (date: string, field: "income" | "outgoing", amount: number) => {
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) {
      months[key][field] += amount;
    }
  };

  incomingRequests
    .filter((r) => r.status === "PAID")
    .forEach((r) => addToMonth(r.created_at, "income", r.amount));

  outgoingRequests
    .filter((r) => r.status === "PAID")
    .forEach((r) => addToMonth(r.created_at, "outgoing", r.amount));

  let totalNetChange = 0;
  monthKeys.forEach((key) => {
    totalNetChange += months[key].income - months[key].outgoing;
  });

  let runningBalance = walletBalance - totalNetChange;

  return monthKeys.map((key) => {
    const [, monthStr] = key.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const data = months[key];
    runningBalance += data.income - data.outgoing;
    return {
      month: MONTH_NAMES[monthIndex],
      income: data.income,
      outgoing: data.outgoing,
      balance: Math.max(0, runningBalance),
    };
  });
}

// ── Custom styled tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const colorMap: Record<string, { dot: string; label: string }> = {
    income: { dot: "#10B981", label: "Received" },
    outgoing: { dot: "#8B5CF6", label: "Sent" },
    balance: { dot: "#F59E0B", label: "Balance" },
  };

  return (
    <div
      style={{
        background: "rgba(8, 12, 24, 0.96)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "14px 16px",
        boxShadow:
          "0 20px 60px -12px rgba(0,0,0,0.7), 0 0 30px rgba(202,138,4,0.08)",
        minWidth: "160px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 800,
          color: "#4D5570",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {label}
      </p>
      {payload.map((entry: any) => {
        const meta = colorMap[entry.dataKey] || {
          dot: entry.color,
          label: entry.dataKey,
        };
        return (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "3px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: meta.dot,
                  boxShadow: `0 0 8px ${meta.dot}60`,
                }}
              />
              <span
                style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 500 }}
              >
                {meta.label}
              </span>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#F1F3F8",
                fontFeatureSettings: '"tnum"',
              }}
            >
              ${Number(entry.value).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Custom legend ──
const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;

  const labelMap: Record<string, { label: string; color: string }> = {
    income: { label: "Received", color: "#10B981" },
    outgoing: { label: "Sent", color: "#8B5CF6" },
    balance: { label: "Total Balance", color: "#F59E0B" },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        paddingTop: "12px",
        flexWrap: "wrap",
      }}
    >
      {payload.map((entry: any) => {
        const meta = labelMap[entry.dataKey] || {
          label: entry.dataKey,
          color: entry.color,
        };
        return (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "3px",
                borderRadius: "2px",
                background: meta.color,
                boxShadow: `0 0 6px ${meta.color}50`,
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#7A839A",
              }}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Animated dot component ──
const GlowDot = ({ cx, cy, fill }: any) => {
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill={fill} opacity={0.3} />
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill={fill}
        stroke="#0A0E1A"
        strokeWidth={1.5}
      />
    </g>
  );
};

// ── Animated Number Display ──
function AnimatedValue({ value, prefix = "$", decimals = 0, color }: { value: number; prefix?: string; decimals?: number; color: string }) {
  const animated = useAnimatedNumber(value);
  const formatted = decimals > 0
    ? animated.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(animated).toLocaleString();

  return (
    <span style={{ color, fontFeatureSettings: '"tnum"' }}>
      {prefix}{formatted}
    </span>
  );
}

// ════════════════════════════════════════
// ── Main Component ──
// ════════════════════════════════════════
export default function FinanceAnalytics({
  incomingPaid,
  outgoingPaid,
  walletBalance,
  incomingRequests,
  outgoingRequests,
}: FinanceAnalyticsProps) {
  const currentBalance = walletBalance ?? INITIAL_BALANCE;

  const chartData = useMemo(
    () => buildMonthlyData(incomingRequests, outgoingRequests, currentBalance),
    [incomingRequests, outgoingRequests, currentBalance]
  );

  const hasActivity = chartData.some((d) => d.income > 0 || d.outgoing > 0);

  const netFlow = incomingPaid - outgoingPaid;
  const isPositive = netFlow >= 0;

  const lastMonth = chartData[chartData.length - 2] || { income: 0, outgoing: 0 };
  const thisMonth = chartData[chartData.length - 1] || { income: 0, outgoing: 0 };
  const incomeChange =
    lastMonth.income > 0
      ? (((thisMonth.income - lastMonth.income) / lastMonth.income) * 100).toFixed(1)
      : "0";
  const expenseChange =
    lastMonth.outgoing > 0
      ? (((thisMonth.outgoing - lastMonth.outgoing) / lastMonth.outgoing) * 100).toFixed(1)
      : "0";

  const animatedNetFlow = useAnimatedNumber(Math.abs(netFlow));
  const animatedIncoming = useAnimatedNumber(incomingPaid);
  const animatedOutgoing = useAnimatedNumber(outgoingPaid);

  return (
    <div className="finance-analytics animate-fade-in-up">
      {/* Top gradient shimmer line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(202,138,4,0.3), rgba(139,92,246,0.2), transparent)",
        }}
      />

      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(202,138,4,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "-40px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Header ─── */}
      <div className="analytics-header">
        {/* Title */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(202,138,4,0.15), rgba(139,92,246,0.08))",
                border: "1px solid rgba(202,138,4,0.25)",
                boxShadow: "0 0 16px rgba(202,138,4,0.08)",
              }}
            >
              <Activity style={{ width: 16, height: 16, color: "#CA8A04" }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#F1F3F8",
                  letterSpacing: "-0.02em",
                }}
              >
                Finance Analytics
              </h2>
              <p
                style={{
                  fontSize: "11px",
                  color: "#4D5570",
                  fontWeight: 500,
                  marginTop: "1px",
                }}
              >
                {hasActivity
                  ? "Your financial overview · Last 6 months"
                  : "No activity yet · Start transacting to see your data"}
              </p>
            </div>
          </div>
        </div>

        {/* Metric pills */}
        <div className="metric-pills">
          {/* Net Flow */}
          <div
            className="metric-pill"
            style={{
              background: isPositive
                ? "rgba(16,185,129,0.06)"
                : "rgba(239,68,68,0.06)",
              border: `1px solid ${
                isPositive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"
              }`,
            }}
          >
            {isPositive ? (
              <TrendingUp
                style={{ width: 14, height: 14, color: "#10B981", flexShrink: 0 }}
              />
            ) : (
              <TrendingDown
                style={{ width: 14, height: 14, color: "#EF4444", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p className="pill-label" style={{ color: isPositive ? "#10B981" : "#EF4444" }}>
                Net Flow
              </p>
              <p className="pill-value" style={{ color: isPositive ? "#6EE7B7" : "#FCA5A5" }}>
                {isPositive ? "+" : "-"}${animatedNetFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Income pill */}
          <div
            className="metric-pill"
            style={{
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.12)",
            }}
          >
            <ArrowDownLeft
              style={{ width: 14, height: 14, color: "#6EE7B7", flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <p className="pill-label" style={{ color: "#10B981" }}>
                Received
              </p>
              <p className="pill-value" style={{ color: "#6EE7B7" }}>
                ${animatedIncoming.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Outgoing pill */}
          <div
            className="metric-pill"
            style={{
              background: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.12)",
            }}
          >
            <ArrowUpRight
              style={{ width: 14, height: 14, color: "#C4B5FD", flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <p className="pill-label" style={{ color: "#8B5CF6" }}>
                Sent
              </p>
              <p className="pill-value" style={{ color: "#C4B5FD" }}>
                ${animatedOutgoing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Chart ─── */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
          >
            <defs>
              {/* Income gradient - green */}
              <linearGradient id="incomeGradPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#10B981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              {/* Outgoing gradient - purple */}
              <linearGradient id="outgoingGradPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              {/* Balance gradient - gold */}
              <linearGradient id="balanceGradPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.15} />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              {/* Glow filters */}
              <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#10B981" floodOpacity="0.3" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#8B5CF6" floodOpacity="0.3" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowGold" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#F59E0B" floodOpacity="0.3" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="4 8"
              stroke="rgba(255,255,255,0.03)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: "#4D5570",
                fontSize: 10,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{
                fill: "#4D5570",
                fontSize: 10,
                fontWeight: 500,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => {
                if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                return `$${v}`;
              }}
              width={48}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(202,138,4,0.15)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Legend content={<CustomLegend />} />

            {/* Balance area - rendered first (behind) */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#F59E0B"
              strokeWidth={2.5}
              fill="url(#balanceGradPremium)"
              dot={false}
              activeDot={(props: any) => (
                <GlowDot {...props} fill="#F59E0B" />
              )}
              strokeOpacity={0.9}
              isAnimationActive={true}
              animationDuration={800}
            />

            {/* Income area */}
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#incomeGradPremium)"
              dot={false}
              activeDot={(props: any) => (
                <GlowDot {...props} fill="#10B981" />
              )}
              isAnimationActive={true}
              animationDuration={800}
            />

            {/* Outgoing area */}
            <Area
              type="monotone"
              dataKey="outgoing"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#outgoingGradPremium)"
              dot={false}
              activeDot={(props: any) => (
                <GlowDot {...props} fill="#8B5CF6" />
              )}
              isAnimationActive={true}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Bottom Mini Stats ─── */}
      <div className="analytics-bottom-stats">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.08)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(16,185,129,0.1)",
              flexShrink: 0,
            }}
          >
            <ArrowDownLeft style={{ width: 14, height: 14, color: "#6EE7B7" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#4D5570",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              This Month
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#6EE7B7",
                fontFeatureSettings: '"tnum"',
              }}
            >
              <AnimatedValue value={thisMonth.income} color="#6EE7B7" />
              {Number(incomeChange) !== 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color:
                      Number(incomeChange) >= 0
                        ? "rgba(16,185,129,0.7)"
                        : "rgba(239,68,68,0.7)",
                    marginLeft: "6px",
                  }}
                >
                  {Number(incomeChange) >= 0 ? "↑" : "↓"}
                  {Math.abs(Number(incomeChange))}%
                </span>
              )}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(139,92,246,0.04)",
            border: "1px solid rgba(139,92,246,0.08)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(139,92,246,0.1)",
              flexShrink: 0,
            }}
          >
            <ArrowUpRight style={{ width: 14, height: 14, color: "#C4B5FD" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#4D5570",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              This Month
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#C4B5FD",
                fontFeatureSettings: '"tnum"',
              }}
            >
              <AnimatedValue value={thisMonth.outgoing} color="#C4B5FD" />
              {Number(expenseChange) !== 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color:
                      Number(expenseChange) <= 0
                        ? "rgba(16,185,129,0.7)"
                        : "rgba(239,68,68,0.7)",
                    marginLeft: "6px",
                  }}
                >
                  {Number(expenseChange) >= 0 ? "↑" : "↓"}
                  {Math.abs(Number(expenseChange))}%
                </span>
              )}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(245,158,11,0.04)",
            border: "1px solid rgba(245,158,11,0.08)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(245,158,11,0.1)",
              flexShrink: 0,
            }}
          >
            <Wallet style={{ width: 14, height: 14, color: "#FCD34D" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#4D5570",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Balance
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#FCD34D",
                fontFeatureSettings: '"tnum"',
              }}
            >
              <AnimatedValue value={currentBalance} color="#FCD34D" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
