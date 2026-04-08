"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LogOut,
  Zap,
  Loader2,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  DollarSign,
  Link2,
  Search,
  X as XIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PaymentRequest, PaymentStatus, getEffectiveStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import RequestMoneyModal from "@/components/RequestMoneyModal";
import TransactionConfirmModal from "@/components/TransactionConfirmModal";
import FinanceAnalytics from "@/components/FinanceAnalytics";
import WalletCard from "@/components/WalletCard";

// ── Count-up animation hook ──
function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

type Tab = "incoming" | "outgoing";
type StatusFilter = "ALL" | PaymentStatus;

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("incoming");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [incoming, setIncoming] = useState<PaymentRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  const [confirmPayTarget, setConfirmPayTarget] = useState<PaymentRequest | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type, visible: true });
    },
    []
  );

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Fetch requests from DB
  const fetchRequests = useCallback(async (email: string) => {
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .or(`recipient_email.eq.${email},sender_email.eq.${email}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIncoming(data.filter((r) => r.recipient_email === email));
      setOutgoing(data.filter((r) => r.sender_email === email));
    }
  }, []);

  // Fetch wallet balance from profiles table
  const fetchBalance = useCallback(async (uid: string) => {
    const { data, error, status } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", uid)
      .maybeSingle();
      
    if (error) {
      console.error("fetchBalance error details:", error, "status:", status);
    }
    
    if (data && data.balance !== undefined && data.balance !== null) {
      setCurrentBalance(Number(data.balance));
    } else {
      console.warn("fetchBalance returned no balance data for uid:", uid);
      setCurrentBalance((prev) => (prev !== null ? prev : 50000)); 
    }
    
    setBalanceLoading(false);
  }, []);

  // Fetch real authenticated user & subscribe to realtime
  useEffect(() => {
    let active = true;
    let reqChannel: ReturnType<typeof supabase.channel> | null = null;
    let balChannel: ReturnType<typeof supabase.channel> | null = null;

    let authUserEmail = "";
    let authUserId = "";

    const initialize = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;

        if (user?.email) {
          setUserEmail(user.email);
          setUserId(user.id);
          authUserEmail = user.email;
          authUserId = user.id;
          fetchRequests(user.email);
          fetchBalance(user.id);

          reqChannel = supabase
            .channel(`payment_requests_changes_${user.id}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'payment_requests' },
              (payload) => {
                if (authUserEmail) fetchRequests(authUserEmail);
                if (authUserId) fetchBalance(authUserId);

                if (payload.eventType === 'UPDATE' && payload.new) {
                  const updated = payload.new as { sender_email?: string; status?: string; amount?: number; recipient_email?: string };
                  const isSender = updated.sender_email === authUserEmail;
                  if (isSender) {
                    const amt = updated.amount ? `$${Number(updated.amount).toFixed(2)}` : '';
                    const rec = updated.recipient_email || 'the recipient';
                    if (updated.status === 'PAID') {
                      showToast(`✅ Payment of ${amt} from ${rec} has been approved!`, 'success');
                    } else if (updated.status === 'DECLINED') {
                      showToast(`❌ Payment request of ${amt} to ${rec} was declined.`, 'error');
                    }
                  }
                }
              }
            )
            .subscribe();

          balChannel = supabase
            .channel(`profile_balance_${user.id}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
              (payload) => {
                if (payload.new && (payload.new as any).balance !== undefined) {
                  setCurrentBalance(Number((payload.new as any).balance));
                }
              }
            )
            .subscribe();

        } else {
          router.push("/login");
          return;
        }
      } catch {
        if (active) router.push("/login");
        return;
      } finally {
        if (active) setUserLoading(false);
      }
    };

    initialize();

    return () => {
      active = false;
      if (reqChannel) supabase.removeChannel(reqChannel);
      if (balChannel) supabase.removeChannel(balChannel);
    };
  }, [router, fetchRequests, showToast, fetchBalance]);

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Opens the PIN confirmation modal instead of paying immediately
  const handlePay = (req: PaymentRequest) => {
    setConfirmPayTarget(req);
  };

  const confirmAndPay = async () => {
    if (!confirmPayTarget) return;
    const id = confirmPayTarget.id;
    setPayingId(id);

    try {
      const { error } = await supabase.rpc('process_payment', {
        request_id: id,
      });

      if (error) {
        if (error.message.includes('expired')) {
          showToast(`This request expired on ${formatDate(confirmPayTarget.expires_at)}`, "error");
        } else if (error.message.includes('pending')) {
          showToast("This request has already been paid", "error");
        } else {
          showToast("Payment failed. Please try again.", "error");
        }
      } else {
        showToast("Payment successful! Funds have been transferred.", "success");
        if (userId) {
          fetchBalance(userId);
        }
      }
    } catch (e) {
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setPayingId(null);
      setConfirmPayTarget(null);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "DECLINED" })
        .eq("id", id);
      if (error) {
        showToast("Payment failed. Please try again.", "error");
      } else {
        showToast("Request declined.", "success");
      }
    } catch {
      showToast("Payment failed. Please try again.", "error");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "CANCELED" })
        .eq("id", id);
      if (error) {
        showToast("Payment failed. Please try again.", "error");
      } else {
        showToast("Request canceled.", "success");
      }
    } catch {
      showToast("Payment failed. Please try again.", "error");
    }
  };

  const handleNewRequest = async (data: {
    recipientEmail: string;
    amount: number;
    note: string;
  }) => {
    const incomingPaidAmount = outgoing.filter((r) => r.status === "PAID").reduce((sum, r) => sum + (r.amount || 0), 0);
    const outgoingPaidAmount = incoming.filter((r) => r.status === "PAID").reduce((sum, r) => sum + (r.amount || 0), 0);
    const baseBalance = currentBalance !== null ? currentBalance : 50000;
    const dynamicBalance = baseBalance + incomingPaidAmount - outgoingPaidAmount;

    if (data.amount > dynamicBalance) {
      showToast("Insufficient balance — transaction exceeds available funds", "error");
      return;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { error } = await supabase.from('payment_requests').insert({
        sender_id: user?.id || "unknown",
        sender_email: userEmail,
        recipient_email: data.recipientEmail,
        recipient_contact: data.recipientEmail,
        amount: data.amount,
        note: data.note || null,
        status: "PENDING",
        created_at: now.toISOString(),
        expires_at: expires
      });

      if (error) {
        showToast("Payment failed. Please try again.", "error");
      } else {
        showToast(
          `Request for $${data.amount.toFixed(2)} sent to ${data.recipientEmail}`,
          "success"
        );
        setModalOpen(false);
      }
    } catch {
      showToast("Payment failed. Please try again.", "error");
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getInitials = (email: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const totalPending = incoming.filter(
    (r) => getEffectiveStatus(r) === "PENDING"
  ).length;

  const totalReceived = outgoing
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalSent = incoming
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  let currentList = activeTab === "incoming" ? incoming : outgoing;

  if (statusFilter !== "ALL") {
    currentList = currentList.filter(r => getEffectiveStatus(r) === statusFilter);
  }

  if (debouncedSearch) {
    const lowerQ = debouncedSearch.toLowerCase();
    currentList = currentList.filter(
      (r) => 
        (r.sender_email && r.sender_email.toLowerCase().includes(lowerQ)) ||
        (r.recipient_email && r.recipient_email.toLowerCase().includes(lowerQ)) ||
        (r.note && r.note.toLowerCase().includes(lowerQ))
    );
  }

  const baseBalance = currentBalance !== null ? currentBalance : 50000;
  const derivedBalance = baseBalance + totalReceived - totalSent;

  const animatedReceived = useAnimatedNumber(totalReceived);
  const animatedSent = useAnimatedNumber(totalSent);
  const animatedBalance = useAnimatedNumber(derivedBalance);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#06080F", position: "relative" }}>
      {/* Background gradient orbs */}
      <div className="bg-gradient-mesh" />

      {/* ══════ Navbar ══════ */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(15, 20, 35, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="dash-nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(202,138,4,0.2), rgba(202,138,4,0.05))",
                border: "1px solid rgba(202,138,4,0.3)",
              }}
            >
              <Zap style={{ width: 18, height: 18, color: "#CA8A04" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#F1F3F8", letterSpacing: "-0.01em" }}>
              Pay<span style={{ color: "#CA8A04" }}>Flow</span>
            </span>
          </div>

          <div className="nav-right">
            <div className="nav-user-badge">
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(202,138,4,0.2), rgba(202,138,4,0.05))",
                  border: "1px solid rgba(202,138,4,0.2)",
                  color: "#FDE68A",
                  flexShrink: 0,
                }}
              >
                {getInitials(userEmail)}
              </div>
              <span className="nav-email">
                {userEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px",
                borderRadius: "10px",
                background: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#7A839A",
                cursor: "pointer",
                transition: "all 200ms",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              aria-label="Logout"
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════ Main Content ══════ */}
      <main className="dash-main">
        {/* Header Row */}
        <div className="dash-header animate-fade-in-up">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p style={{ color: "#7A839A", fontSize: "14px", fontWeight: 500 }}>
              You have{" "}
              <span style={{ color: "#FDE68A", fontWeight: 700 }}>{totalPending} pending</span>{" "}
              requests requiring your attention.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            id="new-request-btn"
            className="request-money-btn"
          >
            <Plus style={{ width: 20, height: 20 }} />
            Request Money
          </button>
        </div>

        {/* Premium Digital Wallet Card */}
        <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <WalletCard
            balance={animatedBalance}
            userEmail={userEmail}
            loading={balanceLoading}
          />
        </div>

        {/* ══════ Stats Grid ══════ */}
        <div className="stats-grid">
          {/* Total Received */}
          <div className="stat-card stat-card-gold animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(202,138,4,0.2), transparent)" }} />
            <div className="stat-header">
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Total Received
              </p>
              <div className="stat-icon" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <ArrowDownLeft style={{ width: 18, height: 18, color: "#6EE7B7" }} />
              </div>
            </div>
            <p className="stat-value">
              ${animatedReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {totalReceived > 0 ? (
                <>
                  <TrendingUp style={{ width: 14, height: 14, color: "#6EE7B7" }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#6EE7B7" }}>Lifetime earned</span>
                </>
              ) : (
                <span style={{ fontSize: "12px", color: "#7A839A" }}>No income yet</span>
              )}
            </div>
          </div>

          {/* Total Sent */}
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
            <div className="stat-header">
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Total Sent
              </p>
              <div className="stat-icon" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <ArrowUpRight style={{ width: 18, height: 18, color: "#93C5FD" }} />
              </div>
            </div>
            <p className="stat-value">
              ${animatedSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {totalSent > 0 ? (
                <>
                  <DollarSign style={{ width: 14, height: 14, color: "#93C5FD" }} />
                  <span style={{ fontSize: "12px", color: "#7A839A" }}>Lifetime total</span>
                </>
              ) : (
                <span style={{ fontSize: "12px", color: "#7A839A" }}>No outgoing yet</span>
              )}
            </div>
          </div>

          {/* Pending */}
          <div className="stat-card animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
            <div className="stat-header">
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Pending
              </p>
              <div className="stat-icon" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Clock style={{ width: 18, height: 18, color: "#FCD34D" }} />
              </div>
            </div>
            <p className="stat-value">
              {totalPending}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#7A839A" }}>Awaiting action</span>
            </div>
          </div>
        </div>

        {/* Finance Analytics Chart */}
        <FinanceAnalytics
          incomingPaid={totalReceived}
          outgoingPaid={totalSent}
          walletBalance={derivedBalance}
          incomingRequests={outgoing}
          outgoingRequests={incoming}
        />

        {/* ══════ Filter Controls ══════ */}
        <div className="tab-controls animate-fade-in-up" style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
          marginBottom: "24px",
          background: "rgba(15, 20, 35, 0.4)",
          padding: "16px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            {/* Main Tabs */}
            <div style={{
                display: "flex",
                padding: "4px",
                borderRadius: "12px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              {(["incoming", "outgoing"] as Tab[]).map((tab) => {
                const isActive = activeTab === tab;
                const Icon = tab === "incoming" ? ArrowDownLeft : ArrowUpRight;
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setStatusFilter("ALL"); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600,
                      border: isActive ? "1px solid rgba(202,138,4,0.3)" : "1px solid transparent",
                      background: isActive ? "rgba(202,138,4,0.15)" : "transparent",
                      color: isActive ? "#FDE68A" : "#7A839A",
                      cursor: "pointer", transition: "all 200ms ease-out", flex: 1, justifyContent: "center"
                    }}
                  >
                    <Icon style={{ width: 14, height: 14 }} />
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Search style={{ width: 16, height: 16, color: "#7A839A" }} />
              </div>
              <input 
                type="text"
                placeholder="Search by email or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "10px 36px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px", color: "#F1F3F8", fontSize: "13px", outline: "none", transition: "border 200ms"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(202,138,4,0.5)";
                  e.target.style.boxShadow = "0 0 0 2px rgba(202,138,4,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7A839A" }}
                >
                  <XIcon style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
          </div>

          {/* Sub Tabs (Status Filter) */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
             <span style={{ fontSize: "12px", fontWeight: 600, color: "#7A839A", marginRight: "4px" }}>Status:</span>
             {(["ALL", "PENDING", "PAID", "DECLINED", "EXPIRED"] as StatusFilter[]).map((status) => {
               const isActive = statusFilter === status;
               const sourceList = activeTab === "incoming" ? incoming : outgoing;
               const count = status === "ALL" 
                  ? sourceList.length 
                  : sourceList.filter(r => getEffectiveStatus(r) === status).length;

               return (
                 <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                    color: isActive ? "#F1F3F8" : "#7A839A",
                    border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                    cursor: "pointer", transition: "all 200ms"
                  }}
                 >
                    {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                    <span style={{ 
                      background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                      padding: "2px 6px", borderRadius: "10px", fontSize: "10px"
                    }}>
                      {count}
                    </span>
                 </button>
               )
             })}
             
             <div style={{ marginLeft: "auto", fontSize: "12px", color: "#7A839A" }}>
               Showing <span style={{ color: "#C8CDD8", fontWeight: 600 }}>{currentList.length}</span> requests
             </div>
          </div>
        </div>

        {/* ══════ Request List ══════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentList.length === 0 ? (
            <div className="empty-state animate-fade-in-up">
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <UserIcon style={{ width: 28, height: 28, color: "#4D5570" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F1F3F8", marginBottom: "8px", textAlign: "center" }}>
                {debouncedSearch ? `No requests matching "${debouncedSearch}"` : statusFilter !== "ALL" ? `No ${statusFilter.toLowerCase()} requests` : `No ${activeTab} requests`}
              </h3>
              <p style={{ color: "#7A839A", fontSize: "14px", textAlign: "center" }}>
                {debouncedSearch 
                  ? "Try adjusting your search query." 
                  : statusFilter !== "ALL" 
                    ? "You don't have any requests matching this status." 
                    : activeTab === "incoming" ? "You're all caught up!" : "Send a request to get paid."}
              </p>
            </div>
          ) : (
            currentList.map((req, i) => {
              const status = getEffectiveStatus(req);
              const isPaying = payingId === req.id;
              const isIncoming = activeTab === "incoming";
              const isActionable = status === "PENDING" && !isPaying;
              const contactEmail = isIncoming
                ? req.sender_email || "Unknown"
                : req.recipient_email;

              return (
                <div
                  key={req.id}
                  className="request-card animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Top shimmer */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }} />

                  {/* Main section: Avatar + Details */}
                  <div className="request-card-main">
                    {/* Avatar */}
                    <div className="request-avatar">
                      {getInitials(contactEmail)}
                    </div>

                    {/* Details */}
                    <div className="request-details">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <h3 style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contactEmail}</h3>
                        <StatusBadge status={status} />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(`${window.location.origin}/request/${req.id}`);
                            showToast("Link copied to clipboard!", "success");
                          }}
                          style={{
                            marginLeft: "auto",
                            padding: "6px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "#7A839A",
                            cursor: "pointer",
                            transition: "all 200ms",
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Copy Link"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#CA8A04";
                            e.currentTarget.style.borderColor = "rgba(202,138,4,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#7A839A";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                          }}
                        >
                          <Link2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                      <p className="request-note">
                        {req.note || "No note provided"}
                      </p>
                      <p className="request-date">
                        Expires {formatDate(req.expires_at)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom section: Amount & Actions */}
                  <div className="request-card-actions">
                    <div className="request-amount">
                      {formatAmount(req.amount)}
                    </div>

                    <div className="request-action-buttons">
                      {isPaying ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 16px",
                            borderRadius: "12px",
                            background: "rgba(15,20,35,0.65)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Loader2 style={{ width: 16, height: 16, color: "#CA8A04" }} className="animate-spin" />
                          <span style={{ color: "#7A839A", fontSize: "13px", fontWeight: 600 }}>Processing...</span>
                        </div>
                      ) : isActionable && isIncoming ? (
                        <>
                          <button onClick={() => handlePay(req)} className="btn-pay">
                            Pay
                          </button>
                          <button onClick={() => handleDecline(req.id)} className="btn-decline">
                            Decline
                          </button>
                        </>
                      ) : isActionable && !isIncoming ? (
                        <button onClick={() => handleCancel(req.id)} className="btn-decline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <XCircle style={{ width: 16, height: 16 }} />
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <RequestMoneyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentUserEmail={userEmail}
        onSubmit={handleNewRequest}
      />

      <TransactionConfirmModal
        isOpen={confirmPayTarget !== null}
        onClose={() => setConfirmPayTarget(null)}
        onConfirm={confirmAndPay}
        amount={confirmPayTarget?.amount ?? 0}
        recipientEmail={confirmPayTarget?.sender_email ?? ""}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={closeToast}
      />
    </div>
  );
}
