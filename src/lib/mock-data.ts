import { PaymentRequest, User } from './types';

export const mockCurrentUser: User = {
  id: 'user-001',
  email: 'demo@payflow.com',
  created_at: new Date().toISOString(),
};

const now = new Date();
const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
const threeDaysFromThreeDaysAgo = new Date(tenDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000);

// Requests sent TO the current user (incoming)
export const mockIncomingRequests: PaymentRequest[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sender_id: 'user-002',
    sender_email: 'alice@example.com',
    recipient_email: 'demo@payflow.com',
    amount: 45.00,
    note: 'Dinner split from last Friday',
    status: 'PENDING',
    created_at: now.toISOString(),
    expires_at: sevenDaysFromNow.toISOString(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    sender_id: 'user-003',
    sender_email: 'bob@example.com',
    recipient_email: 'demo@payflow.com',
    amount: 120.50,
    note: 'Concert tickets',
    status: 'PENDING',
    created_at: threeDaysAgo.toISOString(),
    expires_at: new Date(threeDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    sender_id: 'user-004',
    sender_email: 'carol@example.com',
    recipient_email: 'demo@payflow.com',
    amount: 25.00,
    note: 'Coffee and pastries',
    status: 'PENDING',
    created_at: tenDaysAgo.toISOString(),
    expires_at: threeDaysFromThreeDaysAgo.toISOString(), // This one is expired
  },
];

// Requests sent BY the current user (outgoing)
export const mockOutgoingRequests: PaymentRequest[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    sender_id: 'user-001',
    sender_email: 'demo@payflow.com',
    recipient_email: 'david@example.com',
    amount: 75.00,
    note: 'Uber ride share',
    status: 'PENDING',
    created_at: now.toISOString(),
    expires_at: sevenDaysFromNow.toISOString(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    sender_id: 'user-001',
    sender_email: 'demo@payflow.com',
    recipient_email: 'eve@example.com',
    amount: 200.00,
    note: 'Rent contribution',
    status: 'PAID',
    created_at: threeDaysAgo.toISOString(),
    expires_at: new Date(threeDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    sender_id: 'user-001',
    sender_email: 'demo@payflow.com',
    recipient_email: 'frank@example.com',
    amount: 30.00,
    note: 'Lunch',
    status: 'DECLINED',
    created_at: threeDaysAgo.toISOString(),
    expires_at: new Date(threeDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    sender_id: 'user-001',
    sender_email: 'demo@payflow.com',
    recipient_email: 'grace@example.com',
    amount: 15.00,
    note: null,
    status: 'PENDING',
    created_at: tenDaysAgo.toISOString(),
    expires_at: threeDaysFromThreeDaysAgo.toISOString(), // Expired
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    sender_id: 'user-001',
    sender_email: 'demo@payflow.com',
    recipient_email: 'heidi@example.com',
    amount: 50.00,
    note: 'Gift contribution',
    status: 'CANCELED',
    created_at: threeDaysAgo.toISOString(),
    expires_at: new Date(threeDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
