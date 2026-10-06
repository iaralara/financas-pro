import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Transaction, InstallmentPurchase, MonthlyPlan, UserProfile } from '../types';
import { getCurrentMonthYear } from '../utils/formatters';
import { hashPassword } from '../utils/crypto';

interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

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
  // Identificador do dispositivo inicializado de forma imediata (síncrona)
  const [user, setUser] = useState<UserProfile | null>(() => {
    let deviceId = localStorage.getItem('finance_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('finance_device_id', deviceId);
    }
    return {
      id: deviceId,
      email: 'local@device',
      full_name: 'Meu Dispositivo',
    };
  });

  const [loading, setLoading] = useState(false);
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

  // Dados inicializados imediatamente do localStorage para nunca sofrer delay ou sobrescrita
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const deviceId = localStorage.getItem('finance_device_id');
    if (!deviceId) return [];
    const stored = localStorage.getItem(`finance_tx_${deviceId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [installments, setInstallments] = useState<InstallmentPurchase[]>(() => {
    const deviceId = localStorage.getItem('finance_device_id');
    if (!deviceId) return [];
    const stored = localStorage.getItem(`finance_inst_${deviceId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [monthlyPlans, setMonthlyPlans] = useState<Record<string, MonthlyPlan>>(() => {
    const deviceId = localStorage.getItem('finance_device_id');
    if (!deviceId) return {};
    const stored = localStorage.getItem(`finance_plans_${deviceId}`);
    return stored ? JSON.parse(stored) : {};
  });

  // Salvar sempre que transactions, installments ou monthlyPlans mudarem
  useEffect(() => {
    if (user?.id && isMockMode) {
      localStorage.setItem(`finance_tx_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user?.id, isMockMode]);

  useEffect(() => {
    if (user?.id && isMockMode) {
      localStorage.setItem(`finance_inst_${user.id}`, JSON.stringify(installments));
    }
  }, [installments, user?.id, isMockMode]);

  useEffect(() => {
    if (user?.id && isMockMode) {
      localStorage.setItem(`finance_plans_${user.id}`, JSON.stringify(monthlyPlans));
    }
  }, [monthlyPlans, user?.id, isMockMode]);

  // Carregar dados adicionais se for Supabase
  useEffect(() => {
    if (!isMockMode && user) {
      loadData();
    }
  }, [user, isMockMode]);

  const loadData = async () => {
    if (!user) return;

    if (isMockMode) {
      const storedTx = localStorage.getItem(`finance_tx_${user.id}`);
      const storedInst = localStorage.getItem(`finance_inst_${user.id}`);
      const storedPlans = localStorage.getItem(`finance_plans_${user.id}`);

      if (storedTx) setTransactions(JSON.parse(storedTx));
      else {
        setTransactions([]);
        localStorage.setItem(`finance_tx_${user.id}`, JSON.stringify([]));
      }

      if (storedInst) setInstallments(JSON.parse(storedInst));
      else {
        setInstallments([]);
        localStorage.setItem(`finance_inst_${user.id}`, JSON.stringify([]));
      }

      if (storedPlans) setMonthlyPlans(JSON.parse(storedPlans));
      else {
        const initialPlan: Record<string, MonthlyPlan> = {
          [activeMonth]: {
            user_id: user.id,
            month_year: activeMonth,
            available_money: 0,
            expected_income: 0,
            planned_investment: 0,
            fixed_expenses: 0,
            expected_expenses: 0,
            installments_due: 0,
            seasonal_expenses: 0,
            goals_text: '',
            lessons_learned: '',
            reflection_went_well: '',
            reflection_went_wrong: '',
            reflection_overspent: '',
            reflection_habits_keep: '',
            reflection_habits_avoid: '',
            distribution_percentages: { essential: 55, bills_goals: 30, free: 10, education: 5 }
          }
        };
        setMonthlyPlans(initialPlan);
        localStorage.setItem(`finance_plans_${user.id}`, JSON.stringify(initialPlan));
      }
    } else {
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txs) setTransactions(txs);

      const { data: insts } = await supabase.from('installments').select('*').order('created_at', { ascending: false });
      if (insts) setInstallments(insts);

      const { data: plans } = await supabase.from('monthly_plans').select('*');
      if (plans) {
        const planMap: Record<string, MonthlyPlan> = {};
        plans.forEach((p) => {
          planMap[p.month_year] = p;
        });
        setMonthlyPlans(planMap);
      }
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    if (isMockMode) {
      const cleanEmail = email.trim().toLowerCase();
      const accountsRaw = localStorage.getItem('finance_accounts_db');
      const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];
      
      const pwdHash = await hashPassword(password);
      const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

      if (!found) {
        return { error: 'E-mail não encontrado. Clique na aba "Criar Nova Conta" para se cadastrar.' };
      }

      if (found.passwordHash !== pwdHash) {
        return { error: 'Senha incorreta. Verifique e tente novamente.' };
      }

      const loggedUser = { id: found.id, email: found.email, full_name: found.name };
      localStorage.setItem('finance_current_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return {};
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    }
  };

  const signUpWithPassword = async (email: string, password: string, name?: string) => {
    if (isMockMode) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password || password.length < 4) {
        return { error: 'Informe um e-mail válido e uma senha com pelo menos 4 dígitos.' };
      }

      const accountsRaw = localStorage.getItem('finance_accounts_db');
      const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

      if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
        return { error: 'Este e-mail já está cadastrado. Alterne para a aba "Já tenho conta" para entrar.' };
      }

      const pwdHash = await hashPassword(password);
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAccount: StoredAccount = {
        id: newUserId,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        passwordHash: pwdHash,
      };

      accounts.push(newAccount);
      localStorage.setItem('finance_accounts_db', JSON.stringify(accounts));

      // Garante que o novo usuário comece 100% ZERADO (sem registros fictícios)
      localStorage.setItem(`finance_tx_${newUserId}`, JSON.stringify([]));
      localStorage.setItem(`finance_inst_${newUserId}`, JSON.stringify([]));
      localStorage.setItem(`finance_plans_${newUserId}`, JSON.stringify({}));

      const loggedUser = { id: newAccount.id, email: newAccount.email, full_name: newAccount.name };
      localStorage.setItem('finance_current_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { message: 'Conta cadastrada com sucesso com criptografia de ponta a ponta!' };
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) return { error: error.message };
      return { message: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.' };
    }
  };

  const logout = async () => {
    if (isMockMode) {
      localStorage.removeItem('finance_current_user');
      setUser(null);
    } else {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'user_id'>) => {
    if (!user) return;
    const newTx: Transaction = {
      ...txData,
      id: isMockMode ? `tx_${Date.now()}` : undefined as any,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    if (isMockMode) {
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      localStorage.setItem(`finance_tx_${user.id}`, JSON.stringify(updated));
    } else {
      const { data, error } = await supabase.from('transactions').insert([newTx]).select().single();
      if (!error && data) {
        setTransactions([data, ...transactions]);
      }
    }
  };

  const updateTransaction = async (id: string, txData: Partial<Transaction>) => {
    if (!user) return;
    if (isMockMode) {
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...txData } : t));
      setTransactions(updated);
      localStorage.setItem(`finance_tx_${user.id}`, JSON.stringify(updated));
    } else {
      const { data, error } = await supabase.from('transactions').update(txData).eq('id', id).select().single();
      if (!error && data) {
        setTransactions(transactions.map((t) => (t.id === id ? data : t)));
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    if (isMockMode) {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      localStorage.setItem(`finance_tx_${user.id}`, JSON.stringify(updated));
    } else {
      await supabase.from('transactions').delete().eq('id', id);
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const addInstallment = async (instData: Omit<InstallmentPurchase, 'id' | 'user_id'>) => {
    if (!user) return;
    const newInst: InstallmentPurchase = {
      ...instData,
      id: isMockMode ? `inst_${Date.now()}` : undefined as any,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    if (isMockMode) {
      const updated = [newInst, ...installments];
      setInstallments(updated);
      localStorage.setItem(`finance_inst_${user.id}`, JSON.stringify(updated));
    } else {
      const { data, error } = await supabase.from('installments').insert([newInst]).select().single();
      if (!error && data) {
        setInstallments([data, ...installments]);
      }
    }
  };

  const updateInstallment = async (id: string, instData: Partial<InstallmentPurchase>) => {
    if (!user) return;
    if (isMockMode) {
      const updated = installments.map((i) => (i.id === id ? { ...i, ...instData } : i));
      setInstallments(updated);
      localStorage.setItem(`finance_inst_${user.id}`, JSON.stringify(updated));
    } else {
      const { data, error } = await supabase.from('installments').update(instData).eq('id', id).select().single();
      if (!error && data) {
        setInstallments(installments.map((i) => (i.id === id ? data : i)));
      }
    }
  };

  const deleteInstallment = async (id: string) => {
    if (!user) return;
    if (isMockMode) {
      const updated = installments.filter((i) => i.id !== id);
      setInstallments(updated);
      localStorage.setItem(`finance_inst_${user.id}`, JSON.stringify(updated));
    } else {
      await supabase.from('installments').delete().eq('id', id);
      setInstallments(installments.filter((i) => i.id !== id));
    }
  };

  const saveMonthlyPlan = async (plan: MonthlyPlan) => {
    if (!user) return;
    const planToSave = { ...plan, user_id: user.id };

    if (isMockMode) {
      const updatedPlans = { ...monthlyPlans, [plan.month_year]: planToSave };
      setMonthlyPlans(updatedPlans);
      localStorage.setItem(`finance_plans_${user.id}`, JSON.stringify(updatedPlans));
    } else {
      const { data, error } = await supabase
        .from('monthly_plans')
        .upsert(planToSave, { onConflict: 'user_id,month_year' })
        .select()
        .single();
      if (!error && data) {
        setMonthlyPlans({ ...monthlyPlans, [plan.month_year]: data });
      }
    }
  };

  const getPlanForMonth = (month: string): MonthlyPlan => {
    if (monthlyPlans[month]) return monthlyPlans[month];
    return {
      user_id: user?.id || '',
      month_year: month,
      available_money: 0,
      expected_income: 0,
      planned_investment: 0,
      fixed_expenses: 0,
      expected_expenses: 0,
      installments_due: 0,
      seasonal_expenses: 0,
      goals_text: '',
      distribution_percentages: { essential: 55, bills_goals: 30, free: 10, education: 5 },
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
