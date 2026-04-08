import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data: users } = await supabaseService.from('users').select('*').limit(5);
  console.log('public.users:', users);
  
  const { data: profiles } = await supabaseService.from('profiles').select('*').limit(5);
  console.log('public.profiles:', profiles);
  
  const { data: reqs } = await supabaseService.from('payment_requests').select('id, sender_email, recipient_contact, recipient_email');
  console.log('requests:', reqs);
}

run();
