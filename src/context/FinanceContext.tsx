import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Transaction, InstallmentPurchase, MonthlyPlan, UserProfile } from '../types';
import { getCurrentMonthYear } from '../utils/formatters';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ error?: string; message?: string }>;
  logout: () => Promise<void>;
  isMockMode: boolean;
  hideValues: boolean;
  toggleHideValues: () => void;
}

interface DataContextType {
  transactions: Transaction[];
  installments: InstallmentPurchase[];
  monthlyPlans: Record<string, MonthlyPlan>;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addInstallment: (inst: Omit<InstallmentPurchase, 'id' | 'user_id'>) => Promise<void>;
  updateInstallment: (id: string, inst: Partial<InstallmentPurchase>) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  saveMonthlyPlan: (plan: MonthlyPlan) => Promise<void>;
  getPlanForMonth: (month: string) => MonthlyPlan;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const DataContext = createContext<DataContextType>({} as DataContextType);

export const useAuth = () => useContext(AuthContext);
export const useData = () => useContext(DataContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('finance_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);
  const isMockMode = !isSupabaseConfigured();

  // Olho para ocultar/mostrar valores
  const [hideValues, setHideValues] = useState<boolean>(() => {
    return localStorage.getItem('finance_hide_values') === 'true';
  });

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      localStorage.setItem('finance_hide_values', String(next));
      return next;
    });
  };

  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthYear());

  // Dados com cache local imediato
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const cached = localStorage.getItem('finance_tx_cache');
    return cached ? JSON.parse(cached) : [];
  });

  const [installments, setInstallments] = useState<InstallmentPurchase[]>(() => {
    const cached = localStorage.getItem('finance_inst_cache');
    return cached ? JSON.parse(cached) : [];
  });

  const [monthlyPlans, setMonthlyPlans] = useState<Record<string, MonthlyPlan>>(() => {
    const cached = localStorage.getItem('finance_plans_cache');
    return cached ? JSON.parse(cached) : {};
  });

  // Monitorar autenticação do Supabase
  useEffect(() => {
    // Verificar sessão atual ao inicializar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        };
        setUser(u);
        localStorage.setItem('finance_user_session', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('finance_user_session');
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        };
        setUser(u);
        localStorage.setItem('finance_user_session', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('finance_user_session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Salvar no cache local para rapidez de leitura
  useEffect(() => {
    localStorage.setItem('finance_tx_cache', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_inst_cache', JSON.stringify(installments));
  }, [installments]);

  useEffect(() => {
    localStorage.setItem('finance_plans_cache', JSON.stringify(monthlyPlans));
  }, [monthlyPlans]);

  // Carregar dados sempre que o usuário logado mudar
  useEffect(() => {
    if (user?.id) {
      loadData();
    } else {
      setTransactions([]);
      setInstallments([]);
      setMonthlyPlans({});
      localStorage.removeItem('finance_tx_cache');
      localStorage.removeItem('finance_inst_cache');
      localStorage.removeItem('finance_plans_cache');
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (txs) setTransactions(txs);

      const { data: insts } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (insts) setInstallments(insts);

      const { data: plans } = await supabase
        .from('monthly_plans')
        .select('*')
        .eq('user_id', user.id);

      if (plans) {
        const planMap: Record<string, MonthlyPlan> = {};
        plans.forEach((p) => {
          planMap[p.month_year] = p;
        });
        setMonthlyPlans(planMap);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do Supabase:', e);
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    if (data.user) {
      const u: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
      };
      setUser(u);
      localStorage.setItem('finance_user_session', JSON.stringify(u));
    }
    return {};
  };

  const signUpWithPassword = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name?.trim() || email.split('@')[0] },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const u: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: name?.trim() || data.user.email?.split('@')[0],
      };
      setUser(u);
      localStorage.setItem('finance_user_session', JSON.stringify(u));
    }
    return { message: 'Conta criada e sincronizada com sucesso!' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('finance_user_session');
    localStorage.removeItem('finance_tx_cache');
    localStorage.removeItem('finance_inst_cache');
    localStorage.removeItem('finance_plans_cache');
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;
    const newTx = {
      ...txData,
      user_id: user.id,
    };

    const { data, error } = await supabase.from('transactions').insert([newTx]).select().single();
    if (!error && data) {
      setTransactions((prev) => [data, ...prev]);
    } else {
      console.error('Erro ao adicionar transação:', error);
    }
  };

  const updateTransaction = async (id: string, txData: Partial<Transaction>) => {
    if (!user) return;
    const { data, error } = await supabase.from('transactions').update(txData).eq('id', id).select().single();
    if (!error && data) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addInstallment = async (instData: Omit<InstallmentPurchase, 'id' | 'user_id'>) => {
    if (!user) return;
    const newInst = {
      ...instData,
      user_id: user.id,
    };

    const { data, error } = await supabase.from('installments').insert([newInst]).select().single();
    if (!error && data) {
      setInstallments((prev) => [data, ...prev]);
    }
  };

  const updateInstallment = async (id: string, instData: Partial<InstallmentPurchase>) => {
    if (!user) return;
    const { data, error } = await supabase.from('installments').update(instData).eq('id', id).select().single();
    if (!error && data) {
      setInstallments((prev) => prev.map((i) => (i.id === id ? data : i)));
    }
  };

  const deleteInstallment = async (id: string) => {
    if (!user) return;
    await supabase.from('installments').delete().eq('id', id);
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  };

  const saveMonthlyPlan = async (plan: MonthlyPlan) => {
    if (!user) return;
    const planToSave = { ...plan, user_id: user.id };

    // Atualização otimista imediata na interface
    setMonthlyPlans((prev) => ({ ...prev, [plan.month_year]: planToSave }));

    const { data, error } = await supabase
      .from('monthly_plans')
      .upsert(planToSave, { onConflict: 'user_id,month_year' })
      .select()
      .single();

    if (!error && data) {
      setMonthlyPlans((prev) => ({ ...prev, [plan.month_year]: data }));
    } else if (error) {
      console.error('Erro ao salvar plano mensal no Supabase:', error);
    }
  };

  const getPlanForMonth = (month: string): MonthlyPlan => {
    if (monthlyPlans[month]) return monthlyPlans[month];

    // Se o plano deste mês ainda não foi salvo, buscar as contas fixas do mês mais recente
    const allPlanKeys = Object.keys(monthlyPlans).sort().reverse();
    let templateFixedItems = undefined;
    let templateIncomeItems = undefined;
    let templateGoals = undefined;
    let templateDistribution = { essential: 55, bills_goals: 30, free: 10, education: 5 };

    for (const key of allPlanKeys) {
      const p = monthlyPlans[key];
      if (p.fixed_items && p.fixed_items.length > 0 && !templateFixedItems) {
        templateFixedItems = p.fixed_items;
      }
      if (p.income_items && p.income_items.length > 0 && !templateIncomeItems) {
        templateIncomeItems = p.income_items;
      }
      if (p.goals && p.goals.length > 0 && !templateGoals) {
        templateGoals = p.goals;
      }
      if (p.distribution_percentages) {
        templateDistribution = p.distribution_percentages;
      }
    }

    return {
      user_id: user?.id || '',
      month_year: month,
      available_money: 0,
      expected_income: templateIncomeItems?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0,
      planned_investment: 0,
      fixed_expenses: templateFixedItems?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0,
      expected_expenses: 0,
      installments_due: 0,
      seasonal_expenses: 0,
      goals_text: '',
      distribution_percentages: templateDistribution,
      fixed_items: templateFixedItems,
      income_items: templateIncomeItems,
      goals: templateGoals,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPassword,
        signUpWithPassword,
        logout,
        isMockMode,
        hideValues,
        toggleHideValues,
      }}
    >
      <DataContext.Provider
        value={{
          transactions,
          installments,
          monthlyPlans,
          activeMonth,
          setActiveMonth,
          addTransaction,
          updateTransaction,
          deleteTransaction,
          addInstallment,
          updateInstallment,
          deleteInstallment,
          saveMonthlyPlan,
          getPlanForMonth,
          refreshData: loadData,
        }}
      >
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};
