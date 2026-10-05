-- Esquema de Banco de Dados para App de Finanças Pessoais com Row Level Security (RLS)

-- 1. Tabela de Perfil do Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Tabela de Planejamentos Mensais
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL, -- Formato 'YYYY-MM'
  available_money NUMERIC(12,2) DEFAULT 0,
  expected_income NUMERIC(12,2) DEFAULT 0,
  planned_investment NUMERIC(12,2) DEFAULT 0,
  fixed_expenses NUMERIC(12,2) DEFAULT 0,
  expected_expenses NUMERIC(12,2) DEFAULT 0,
  installments_due NUMERIC(12,2) DEFAULT 0,
  seasonal_expenses NUMERIC(12,2) DEFAULT 0,
  goals_text TEXT,
  lessons_learned TEXT,
  reflection_went_well TEXT,
  reflection_went_wrong TEXT,
  reflection_overspent TEXT,
  reflection_habits_keep TEXT,
  reflection_habits_avoid TEXT,
  distribution_percentages JSONB DEFAULT '{"essential": 55, "bills_goals": 30, "free": 10, "education": 5}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus próprios planos" 
ON public.monthly_plans FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Tabela de Transações (Receitas, Despesas, Investimentos, Transferências)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment', 'transfer')),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- PIX, Débito, Dinheiro, Cartão de crédito, Boleto, Outros
  notes TEXT,
  installment_id UUID, -- Referência opcional caso tenha vindo de um parcelamento
  installment_number INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas próprias transações" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Tabela de Compras Parceladas e Cartões / Dívidas
CREATE TABLE IF NOT EXISTS public.installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  total_installments INT NOT NULL,
  installment_amount NUMERIC(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  due_day INT NOT NULL,
  first_installment_date DATE NOT NULL,
  category TEXT NOT NULL,
  card_name TEXT,
  notes TEXT,
  paid_installments_count INT DEFAULT 0,
  is_debt BOOLEAN DEFAULT FALSE, -- Indica se é uma dívida consolidada
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus próprios parcelamentos" 
ON public.installments FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
