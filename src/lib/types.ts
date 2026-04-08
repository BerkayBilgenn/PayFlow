export type PaymentStatus = 'PENDING' | 'PAID' | 'DECLINED' | 'EXPIRED' | 'CANCELED';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  sender_id: string;
  sender_email?: string;
  recipient_email: string;
  amount: number;
  note: string | null;
  status: PaymentStatus;
  created_at: string;
  expires_at: string;
}

export function isExpired(expires_at: string): boolean {
  return new Date(expires_at).getTime() < new Date().getTime();
}

export function getEffectiveStatus(request: PaymentRequest): PaymentStatus {
  if (request.status === 'PENDING' && isExpired(request.expires_at)) {
    return 'EXPIRED';
  }
  return request.status;
}
