"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PaymentRequest, getEffectiveStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import TransactionConfirmModal from "@/components/TransactionConfirmModal";
import { Loader2, Zap, ArrowLeft, Clock, CalendarIcon, FileText, UserIcon, Send, Link2 } from "lucide-react";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", visible: false });
  const [paying, setPaying] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  
  const fetchRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentUserEmail(user.email);
      setCurrentUserId(user.id);
    }

    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("id", unwrappedParams.id)
      .maybeSingle();

    if (error || !data) {
      setRequest(null);
    } else {
      setRequest(data as PaymentRequest);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequest();
  }, [unwrappedParams.id]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
  };

  const handlePay = () => setConfirmModalOpen(true);

  const confirmAndPay = async () => {
    if (!request) return;
    setPaying(true);

    const { error } = await supabase.rpc('process_payment', {
      request_id: request.id,
    });

    if (!error) {
      showToast("Payment successful! Funds have been transferred.", "success");
      await fetchRequest(); // Refresh status
    } else {
      showToast("Failed to process payment: " + error.message, "error");
    }
    
    setConfirmModalOpen(false);
    setPaying(false);
  };

  const handleAction = async (newStatus: "DECLINED" | "CANCELED") => {
    if (!request) return;
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: newStatus })
      .eq("id", request.id);

    if (!error) {
      showToast(`Request ${newStatus.toLowerCase()}.`, "success");
      await fetchRequest();
    } else {
      showToast("Failed to update status", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <Loader2 className="w-8 h-8 text-[#CA8A04] animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06080F] text-center px-4">
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-full mb-6">
          <Zap className="w-8 h-8 text-[#EF4444]" />
        </div>
        <h1 className="text-2xl font-bold text-[#F1F3F8] mb-2">Request Not Found</h1>
        <p className="text-[#7A839A] mb-8 max-w-sm">
          The payment request you are looking for doesn't exist or you don't have permission to view it.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const effectiveStatus = getEffectiveStatus(request);
  const isPending = effectiveStatus === "PENDING";
  const isRecipient = currentUserEmail === request.recipient_email;
  const isSender = currentUserEmail === request.sender_email;
  const isAuth = !!currentUserEmail;

  const getExpirationText = () => {
    const timeDiff = new Date(request.expires_at).getTime() - new Date().getTime();
    if (timeDiff <= 0) return { text: `Expired on ${new Date(request.expires_at).toLocaleDateString()}`, isUrgent: true };
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    
    return {
      text: `Expires in ${days > 0 ? `${days} days ` : ''}${hours} hours`,
      isUrgent: days === 0 && hours < 24 // Less than 24h
    };
  };

  const expInfo = getExpirationText();

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#06080F] relative py-12 px-4 selection:bg-[#CA8A04]/30">
      <div className="bg-gradient-mesh fixed inset-0 pointer-events-none" />
      
      {/* Header Back Button */}
      {isAuth && (
        <button 
          onClick={() => router.push('/dashboard')}
          className="absolute top-8 left-8 p-2 rounded-xl bg-white/5 border border-white/5 text-[#7A839A] hover:text-white transition flex items-center gap-2 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium pr-2">Dashboard</span>
        </button>
      )}

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="bg-[#0F1423]/80 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl overflow-hidden">
          {/* Top Gold Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#CA8A04] to-transparent opacity-50" />
          
          <div className="p-8">
            {/* Header section */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04]/20 to-[#CA8A04]/5 border border-[#CA8A04]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#CA8A04]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#F1F3F8]">PayFlow Request</h2>
                  <p className="text-xs text-[#7A839A] font-medium tracking-wide">SECURE TRANSFER</p>
                </div>
              </div>
              <StatusBadge status={effectiveStatus} />
            </div>

            {/* Amount Section */}
            <div className="text-center mb-10">
              <p className="text-sm text-[#7A839A] font-medium mb-2">Requested Amount</p>
              <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
                ${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>
              {effectiveStatus === "PENDING" && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${expInfo.isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-[#7A839A] border border-white/5'}`}>
                  <Clock className="w-3 h-3" />
                  {expInfo.text}
                </div>
              )}
              {effectiveStatus === "EXPIRED" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mt-2">
                  <Clock className="w-3 h-3" />
                  This request expired on {new Date(request.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            {/* Details Section */}
            <div className="space-y-5 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Send className="w-3.5 h-3.5 text-[#7A839A]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7A839A] mb-0.5 uppercase tracking-wider">From</p>
                  <p className="text-[#C8CDD8] font-medium">{request.sender_email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#7A839A]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7A839A] mb-0.5 uppercase tracking-wider">To</p>
                  <p className="text-[#C8CDD8] font-medium">{request.recipient_email}</p>
                </div>
              </div>

              {request.note && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-[#7A839A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#7A839A] mb-0.5 uppercase tracking-wider">Note</p>
                    <p className="text-[#C8CDD8] font-medium leading-relaxed">{request.note}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#7A839A]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7A839A] mb-0.5 uppercase tracking-wider">Created</p>
                  <p className="text-[#C8CDD8] font-medium">{new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isPending ? (
              <div className="flex flex-col gap-3">
                {!isAuth ? (
                  <button 
                    onClick={() => router.push('/login')}
                    className="w-full py-4 rounded-xl font-bold text-center text-[#0A0E1A] bg-gradient-to-r from-[#CA8A04] to-[#EAB308] hover:opacity-90 transition shadow-[0_0_20px_rgba(202,138,4,0.3)] flex justify-center items-center gap-2"
                  >
                    Login to Pay
                  </button>
                ) : isRecipient ? (
                  <>
                    <button 
                      onClick={handlePay}
                      disabled={paying}
                      className="w-full py-4 rounded-xl font-bold text-center text-[#0A0E1A] bg-gradient-to-r from-[#CA8A04] to-[#EAB308] hover:opacity-90 transition shadow-[0_0_20px_rgba(202,138,4,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}
                    </button>
                    <button 
                      onClick={() => handleAction("DECLINED")}
                      className="w-full py-3.5 rounded-xl font-bold text-center text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition"
                    >
                      Decline Request
                    </button>
                  </>
                ) : isSender ? (
                  <button 
                    onClick={() => handleAction("CANCELED")}
                    className="w-full py-3.5 rounded-xl font-bold text-center text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition"
                  >
                    Cancel Request
                  </button>
                ) : (
                   <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5 text-[#7A839A] text-sm">
                    Only the recipient can fulfill this request.
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full py-4 rounded-xl font-medium text-center bg-white/5 border border-white/5 text-[#7A839A]">
                This request is closed and requires no further action.
              </div>
            )}
            
            {/* Share link button at the very bottom */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast("Link copied to clipboard!", "success");
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-medium text-[#7A839A] hover:text-white transition"
            >
              <Link2 className="w-4 h-4" />
              Copy Request Link
            </button>

          </div>
        </div>
      </div>

      <TransactionConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmAndPay}
        amount={request.amount}
        recipientEmail={request.sender_email}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
}
