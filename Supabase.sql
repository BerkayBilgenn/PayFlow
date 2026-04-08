-- Execute this in the Supabase SQL Editor

-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 50000.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create Payment Requests Table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_contact TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days' NOT NULL
);

-- 3. Set up Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anon/public read access to payment requests by ID (for shareable links)
-- Wait: users should only query by ID on detail page
CREATE POLICY "Public can view request details"
ON public.payment_requests
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert requests (max amount bound by balance locally)
CREATE POLICY "Users can insert requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid() AND amount > 0);

-- Allow authenticated users to update their own outgoing or incoming requests
CREATE POLICY "Users can update their outgoing or incoming request statuses"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() OR recipient_email = (auth.jwt() ->> 'email')
);

-- Profiles
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 5. Atomic RPC for Payment Processing
CREATE OR REPLACE FUNCTION process_payment(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req RECORD;
  recip_id UUID;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT * INTO req
  FROM payment_requests
  WHERE id = request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  IF req.status != 'PENDING' THEN
    RAISE EXCEPTION 'request is no longer pending';
  END IF;

  IF req.expires_at < NOW() THEN
    RAISE EXCEPTION 'request has expired';
  END IF;

  -- Ensure caller is recipient
  IF req.recipient_email != (auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'Only the recipient can pay this request';
  END IF;
  
  recip_id := auth.uid();

  -- Subtract balance from payer (recipient of the payment request)
  UPDATE profiles
  SET balance = balance - req.amount
  WHERE id = recip_id AND balance >= req.amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Add balance to requester (sender of the payment request)
  UPDATE profiles
  SET balance = balance + req.amount
  WHERE id = req.sender_id;

  -- Mark PAID
  UPDATE payment_requests
  SET status = 'PAID'
  WHERE id = request_id;

END;
$$;
