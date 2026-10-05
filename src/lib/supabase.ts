import { createClient } from '@supabase/supabase-js';

// As chaves podem vir de variáveis de ambiente do Vite (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
// Se não configuradas inicialmente, o sistema usa armazenamento local simulado ou fallback seguro
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-finance-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isSupabaseConfigured = () => {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://mock-finance-project.supabase.co'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
