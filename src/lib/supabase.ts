import { createClient } from '@supabase/supabase-js';

// Conexão oficial ao Supabase com persistência segura de sessão
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nynbmasbjlvspjcorljt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uS_GhwXRIvWQthWWkNUn4g_QncphU_w';

export const isSupabaseConfigured = () => {
  return true;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
