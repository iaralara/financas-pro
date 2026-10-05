export type TransactionType = 'income' | 'expense' | 'investment' | 'transfer';

export type PaymentMethod = 'PIX' | 'Débito' | 'Dinheiro' | 'Cartão de crédito' | 'Boleto' | 'Outros';

export interface PlannedItem {
  id: string;
  name: string;
  amount: number;
  source?: string; // De onde vem ou observação
}

export interface IncomePlanItem {
  id: string;
  source: string; // De onde vem o valor (Ex: Salário Empresa X, Freelance Cliente Y, Venda, Aluguel Recebido)
  description: string; // Do que é o valor (Ex: 13º salário, Comissão, Venda de bolo, Consultoria)
  amount: number;
}

export interface FinancialGoal {
  id: string;
  name: string; // Ex: Viagem 15 anos Bela
  target_amount: number; // Ex: 50000
  monthly_contribution: number; // Ex: 1000
  current_saved: number; // Ex: 5000
  target_date?: string; // Ex: 2027-12
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string; // Do que é o valor
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  notes?: string;
  source?: string; // De onde vem o valor (Empresa, Cliente, Banco, etc.)
  installment_id?: string;
  installment_number?: number;
  created_at?: string;
}

export interface InstallmentPurchase {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  installment_amount: number;
  purchase_date: string;
  due_day: number;
  first_installment_date: string;
  category: string;
  card_name?: string;
  notes?: string;
  paid_installments_count: number;
  is_debt?: boolean;
  created_at?: string;
}

export interface MonthlyPlan {
  id?: string;
  user_id: string;
  month_year: string; // YYYY-MM
  available_money: number;
  expected_income: number;
  planned_investment: number;
  fixed_expenses: number;
  expected_expenses: number;
  installments_due: number;
  seasonal_expenses: number;
  goals_text?: string;
  lessons_learned?: string;
  reflection_went_well?: string;
  reflection_went_wrong?: string;
  reflection_overspent?: string;
  reflection_habits_keep?: string;
  reflection_habits_avoid?: string;
  distribution_percentages?: {
    essential: number;
    bills_goals: number;
    free: number;
    education: number;
  };
  income_items?: IncomePlanItem[]; // Lista detalhada de onde vem e do que é cada receita
  fixed_items?: PlannedItem[];
  variable_items?: PlannedItem[];
  seasonal_items?: PlannedItem[];
  goals?: FinancialGoal[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
}
