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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PaymentRequest, getEffectiveStatus } from "@/lib/types";
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

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("incoming");
  const [incoming, setIncoming] = useState<PaymentRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
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
      // Fallback visual in case RLS blocks reading or row is missing
      // Only set to 50000 if we don't already have a valid local state
      setCurrentBalance((prev) => (prev !== null ? prev : 50000)); 
    }
    
    setBalanceLoading(false);
  }, []);

  // Fetch real authenticated user & subscribe to realtime
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
        if (!active) return; // Prevent state update if unmounted

        if (user?.email) {
          setUserEmail(user.email);
          setUserId(user.id);
          authUserEmail = user.email;
          authUserId = user.id;
          fetchRequests(user.email);
          fetchBalance(user.id);

          // Realtime: payment_requests changes
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

          // Realtime: wallet balance changes (profiles table)
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
    const amountToDeduct = confirmPayTarget.amount || 0;
    setPayingId(id);

    // Use the process_payment RPC to atomically update balances
    const { error } = await supabase.rpc('process_payment', {
      request_id: id,
    });

    setPayingId(null);
    if (!error) {
      showToast("Payment successful! Funds have been transferred.", "success");
      
      // Explicitly refresh balance local state (in addition to realtime)
      if (userId) {
        fetchBalance(userId);
      }
    } else {
      showToast("Failed to process payment: " + error.message, "error");
    }
    setConfirmPayTarget(null);
  };

  const handleDecline = async (id: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "DECLINED" })
      .eq("id", id);
    if (!error) {
      showToast("Request declined.", "success");
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "CANCELED" })
      .eq("id", id);
    if (!error) {
      showToast("Request canceled.", "success");
    }
  };

  const handleNewRequest = async (data: {
    recipientEmail: string;
    amount: number;
    note: string;
  }) => {
    // ── Calculate dynamic balance based on transaction history ──
    // Money earned: Requests I sent out (outgoing) that got PAID
    const incomingPaidAmount = outgoing.filter((r) => r.status === "PAID").reduce((sum, r) => sum + (r.amount || 0), 0);
    // Money spent: Requests sent to me (incoming) that I PAID
    const outgoingPaidAmount = incoming.filter((r) => r.status === "PAID").reduce((sum, r) => sum + (r.amount || 0), 0);
    const dynamicBalance = 50000 + incomingPaidAmount - outgoingPaidAmount;

    // ── Insufficient funds check ──
    if (data.amount > dynamicBalance) {
      showToast(
        `Yetersiz Bakiye — İşlem tutarı ($${data.amount.toFixed(2)}) mevcut bakiyenizden ($${dynamicBalance.toFixed(2)}) fazla.`,
        "error"
      );
      return;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('payment_requests').insert({
      sender_id: user?.id || "unknown",
      sender_email: userEmail,
      recipient_email: data.recipientEmail,
      // Keep old column names as backup in case the DB still has NOT NULL constraints on them
      recipient_contact: data.recipientEmail,
      amount: data.amount,
      note: data.note || null,
      status: "PENDING",
      created_at: now.toISOString(),
      expires_at: expires
    });

    if (error) {
      showToast("Failed to send request: " + error.message, "error");
    } else {
      showToast(
        `Request for $${data.amount.toFixed(2)} sent to ${data.recipientEmail}`,
        "success"
      );
      setModalOpen(false);
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

  // Money earned: Requests I created (outgoing) which got PAID by others
  const totalReceived = outgoing
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  // Money spent: Requests sent to me (incoming) which I PAID
  const totalSent = incoming
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const currentList = activeTab === "incoming" ? incoming : outgoing;

  // ── Derived dynamic balance to ensure frontend perfect sync ──
  const derivedBalance = 50000 + totalReceived - totalSent;

  // ── Animated stat values ──
  const animatedReceived = useAnimatedNumber(totalReceived);
  const animatedSent = useAnimatedNumber(totalSent);
  const animatedBalance = useAnimatedNumber(derivedBalance);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#06080F", position: "relative" }}>
      {/* Background gradient orbs */}
      <div className="bg-gradient-mesh" />

      {/* Navbar */}
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
        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 32px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(202,138,4,0.2), rgba(202,138,4,0.05))",
                border: "1px solid rgba(202,138,4,0.3)",
              }}
            >
              <Zap style={{ width: 20, height: 20, color: "#CA8A04" }} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#F1F3F8", letterSpacing: "-0.01em" }}>
              Pay<span style={{ color: "#CA8A04" }}>Flow</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                borderRadius: "12px",
                background: "rgba(15,20,35,0.65)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
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
                }}
              >
                {getInitials(userEmail)}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#C8CDD8" }}>
                {userEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px",
                borderRadius: "10px",
                background: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#7A839A",
                cursor: "pointer",
                transition: "all 200ms",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Logout"
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Width Centered */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "32px 32px 48px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "24px",
            marginBottom: "32px",
          }}
          className="animate-fade-in-up"
        >
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#F1F3F8", letterSpacing: "-0.025em", marginBottom: "6px" }}>
              Dashboard
            </h1>
            <p style={{ color: "#7A839A", fontSize: "15px", fontWeight: 500 }}>
              You have{" "}
              <span style={{ color: "#FDE68A", fontWeight: 700 }}>{totalPending} pending</span>{" "}
              requests requiring your attention.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            id="new-request-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
              color: "#0A0E1A",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              transition: "all 200ms ease-out",
              letterSpacing: "0.01em",
            }}
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

        {/* Stats Grid - Full Width */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {/* Total Received */}
          <div
            className="animate-fade-in-up"
            style={{
              animationDelay: "100ms",
              background: "rgba(15, 20, 35, 0.65)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(202,138,4,0.2)",
              borderRadius: "20px",
              padding: "28px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 0 20px rgba(202,138,4,0.08)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(202,138,4,0.2), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Total Received
              </p>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <ArrowDownLeft style={{ width: 20, height: 20, color: "#6EE7B7" }} />
              </div>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "#F1F3F8", letterSpacing: "-0.02em", marginBottom: "8px", fontFeatureSettings: '"tnum"' }}>
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
          <div
            className="animate-fade-in-up"
            style={{
              animationDelay: "200ms",
              background: "rgba(15, 20, 35, 0.65)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "28px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Total Sent
              </p>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <ArrowUpRight style={{ width: 20, height: 20, color: "#93C5FD" }} />
              </div>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "#F1F3F8", letterSpacing: "-0.02em", marginBottom: "8px", fontFeatureSettings: '"tnum"' }}>
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
          <div
            className="animate-fade-in-up"
            style={{
              animationDelay: "300ms",
              background: "rgba(15, 20, 35, 0.65)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "28px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7A839A" }}>
                Pending
              </p>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Clock style={{ width: 20, height: 20, color: "#FCD34D" }} />
              </div>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "#F1F3F8", letterSpacing: "-0.02em", marginBottom: "8px" }}>
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
          incomingRequests={outgoing} // Outgoing requests bring money IN
          outgoingRequests={incoming} // Incoming requests take money OUT
        />

        {/* Tab Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
          }}
          className="animate-fade-in-up"
        >
          <div
            style={{
              display: "flex",
              padding: "4px",
              borderRadius: "14px",
              background: "rgba(15,20,35,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {(["incoming", "outgoing"] as Tab[]).map((tab) => {
              const isActive = activeTab === tab;
              const Icon = tab === "incoming" ? ArrowDownLeft : ArrowUpRight;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 24px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: isActive ? "1px solid rgba(202,138,4,0.25)" : "1px solid transparent",
                    background: isActive ? "rgba(202,138,4,0.12)" : "transparent",
                    color: isActive ? "#FDE68A" : "#7A839A",
                    cursor: "pointer",
                    transition: "all 200ms ease-out",
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: "13px", color: "#7A839A" }}>
            Showing <span style={{ color: "#C8CDD8", fontWeight: 600 }}>{currentList.length}</span> requests
          </p>
        </div>

        {/* Request List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentList.length === 0 ? (
            <div
              className="animate-fade-in-up"
              style={{
                background: "rgba(15,20,35,0.65)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "20px",
                padding: "80px 32px",
                textAlign: "center",
              }}
            >
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
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F1F3F8", marginBottom: "8px" }}>
                No {activeTab} requests
              </h3>
              <p style={{ color: "#7A839A", fontSize: "14px" }}>
                {activeTab === "incoming" ? "You're all caught up!" : "Send a request to get paid."}
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
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    background: "rgba(15,20,35,0.65)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "18px",
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    transition: "all 250ms ease-out",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.background = "rgba(15,20,35,0.85)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 40px -8px rgba(0,0,0,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "rgba(15,20,35,0.65)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Top shimmer */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }} />

                  {/* Avatar */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "16px",
                      background: "linear-gradient(135deg, rgba(202,138,4,0.15), rgba(202,138,4,0.05))",
                      border: "1px solid rgba(202,138,4,0.2)",
                      color: "#FDE68A",
                    }}
                  >
                    {getInitials(contactEmail)}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#F1F3F8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {contactEmail}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    <p style={{ color: "#7A839A", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                      {req.note || "No note provided"}
                    </p>
                    <p style={{ color: "#4D5570", fontSize: "12px", fontWeight: 500 }}>
                      Expires {formatDate(req.expires_at)}
                    </p>
                  </div>

                  {/* Amount & Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#F1F3F8", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                      {formatAmount(req.amount)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                          <button
                            onClick={() => handlePay(req)}
                            style={{
                              padding: "10px 24px",
                              background: "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
                              color: "#0A0E1A",
                              fontSize: "13px",
                              fontWeight: 700,
                              border: "none",
                              borderRadius: "12px",
                              cursor: "pointer",
                              transition: "all 200ms ease-out",
                            }}
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            style={{
                              padding: "10px 18px",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#C8CDD8",
                              fontSize: "13px",
                              fontWeight: 600,
                              borderRadius: "12px",
                              cursor: "pointer",
                              transition: "all 200ms ease-out",
                            }}
                          >
                            Decline
                          </button>
                        </>
                      ) : isActionable && !isIncoming ? (
                        <button
                          onClick={() => handleCancel(req.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 18px",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#C8CDD8",
                            fontSize: "13px",
                            fontWeight: 600,
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 200ms ease-out",
                          }}
                        >
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
