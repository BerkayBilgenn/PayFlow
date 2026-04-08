-- Execute this in the Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create Payment Status Enum Type
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'DECLINED', 'EXPIRED', 'CANCELED');

-- 3. Create Payment Requests Table
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_contact TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  status payment_status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days' NOT NULL
);

-- 4. Set up Row Level Security (RLS) Configuration (Optional but Recommended)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users to their own payment requests
CREATE POLICY "Users can view their incoming or outgoing requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_contact = (auth.jwt() ->> 'email')
);

-- Allow authenticated users to create requests
CREATE POLICY "Users can insert requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid() AND amount > 0 AND recipient_contact != (auth.jwt() ->> 'email'));

-- Allow authenticated users to update request status (only specific fields)
CREATE POLICY "Users can update their outgoing or incoming request statuses"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_contact = (auth.jwt() ->> 'email')
);
