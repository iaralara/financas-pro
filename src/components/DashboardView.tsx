import React from 'react';
import { useAuth, useData } from '../context/FinanceContext';
import { formatCurrency, getMonthName } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  CreditCard,
  DollarSign,
  PieChart as PieIcon,
  Sparkles,
  Eye,
  EyeOff,
  PlusCircle,
  Receipt,
  Target,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const DashboardView: React.FC<{
  onOpenNewTx: () => void;
  onOpenNewInstallment: () => void;
  onNavigateTo: (tab: string) => void;
}> = ({ onOpenNewTx, onOpenNewInstallment, onNavigateTo }) => {
  const { hideValues, toggleHideValues } = useAuth();
  const { transactions, installments, activeMonth, getPlanForMonth } = useData();

  const currentPlan = getPlanForMonth(activeMonth);

  // Filtrar transações do mês ativo
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(activeMonth));

  const totalIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvested = currentMonthTxs
    .filter((t) => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Contabilizar parcelas que vencem neste mês
  const activeInstallmentsDueThisMonth = installments.reduce((acc, inst) => {
    if (inst.paid_installments_count < inst.total_installments) {
      return acc + inst.installment_amount;
    }
    return acc;
  }, 0);

  // Dívidas acumuladas (restante de todos os parcelamentos)
  const totalRemainingDebt = installments.reduce((acc, inst) => {
    const remainingCount = inst.total_installments - inst.paid_installments_count;
    return acc + Math.max(0, remainingCount) * inst.installment_amount;
  }, 0);

  // Saldo real realizado
  const realizedBalance = totalIncome - totalExpense - totalInvested;

  // Comparação Planejado x Realizado
  const plannedTotalExpense =
    (currentPlan.fixed_expenses || 0) +
    (currentPlan.expected_expenses || 0) +
    (currentPlan.installments_due || activeInstallmentsDueThisMonth);

  const plannedIncome = currentPlan.expected_income || 0;
  const plannedInvestment = currentPlan.planned_investment || 0;

  // Indicador de Saúde Financeira
  let healthStatus: 'green' | 'yellow' | 'red' = 'green';
  let healthMessage = 'Dentro do planejamento!';

  if (plannedTotalExpense > 0) {
    const ratio = totalExpense / plannedTotalExpense;
    if (ratio > 1.1) {
      healthStatus = 'red';
      healthMessage = `Alerta: Você gastou ${Math.round((ratio - 1) * 100)}% acima do planejado!`;
    } else if (ratio > 1.0) {
      healthStatus = 'yellow';
      healthMessage = `Atenção: Você atingiu o teto do planejamento orçamentário.`;
    } else {
      healthStatus = 'green';
      healthMessage = `Excelente! Gastos controlados a ${Math.round(ratio * 100)}% da meta.`;
    }
  }

  // Agrupamento de despesas por categoria para o Gráfico de Pizza
  const categoryMap: Record<string, number> = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];

  const upcomingBills = installments
    .filter((i) => i.paid_installments_count < i.total_installments)
    .sort((a, b) => a.due_day - b.due_day)
    .slice(0, 4);

  return (
    <div className="space-y-5 pb-24">
      {/* Botões Grandes Mobile-First para Ações Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenNewTx}
          className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 text-white rounded-3xl shadow-lg shadow-blue-600/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight">Novo Lançamento</span>
          <span className="text-[10px] text-blue-200">Gasto, ganho ou aporte</span>
        </button>

        <button
          onClick={onOpenNewInstallment}
          className="p-4 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white rounded-3xl shadow-lg shadow-amber-600/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight">+ Parcela / Cartão</span>
          <span className="text-[10px] text-amber-200">Compras no crédito</span>
        </button>

        <button
          onClick={() => onNavigateTo('planejamento')}
          className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white rounded-3xl shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight">Planejar o Mês</span>
          <span className="text-[10px] text-emerald-200">Decidir antes de gastar</span>
        </button>

        <button
          onClick={() => onNavigateTo('consultor')}
          className="p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:scale-95 text-white rounded-3xl shadow-lg shadow-purple-600/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight">Consultor IA</span>
          <span className="text-[10px] text-purple-200">Onde cortar & Aumentar</span>
        </button>
      </div>

      {/* Top Banner com Mês, Indicador de Saúde e Botão do Olho */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                Visão Geral
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white capitalize">
                {getMonthName(activeMonth)}
              </h1>
            </div>

            {/* Botão do Olho para Privacidade na tela de celular */}
            <button
              onClick={toggleHideValues}
              className={`sm:hidden p-3 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all ${
                hideValues
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Ocultar valores para privacidade"
            >
              {hideValues ? <EyeOff className="w-5 h-5 text-rose-400" /> : <Eye className="w-5 h-5" />}
              <span>{hideValues ? 'Oculto' : 'Visível'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão do Olho no Desktop */}
            <button
              onClick={toggleHideValues}
              className={`hidden sm:flex px-4 py-2 rounded-xl border items-center gap-2 text-xs font-bold transition-all ${
                hideValues
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Modo Privacidade (Oculta números em público)"
            >
              {hideValues ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
              <span>{hideValues ? 'Valores Ocultos' : 'Ocultar Valores'}</span>
            </button>

            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                healthStatus === 'green'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : healthStatus === 'yellow'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  healthStatus === 'green'
                    ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                    : healthStatus === 'yellow'
                    ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                    : 'bg-rose-500 shadow-md shadow-rose-500/50'
                }`}
              />
              {healthMessage}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais (Suporte ao Olho) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Receitas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-400">
            {formatCurrency(totalIncome, hideValues)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Previsto: {formatCurrency(plannedIncome, hideValues)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Despesas</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-400">
            {formatCurrency(totalExpense, hideValues)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Meta: {formatCurrency(plannedTotalExpense, hideValues)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Investimentos</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-400">
            {formatCurrency(totalInvested, hideValues)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Meta: {formatCurrency(plannedInvestment, hideValues)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Saldo Atual</span>
            <div className="p-2 bg-slate-800 text-slate-300 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-lg sm:text-2xl font-black ${
              realizedBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatCurrency(realizedBalance, hideValues)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Realizado do Mês</p>
        </div>
      </div>

      {/* Dívidas e Parcelamentos Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Compromissos Futuros & Parcelas
            </div>
            <button
              onClick={() => onNavigateTo('parcelas')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Ver todas ({installments.length})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-400 block">Vencem este mês:</span>
              <span className="text-sm sm:text-base font-bold text-amber-400">
                {formatCurrency(activeInstallmentsDueThisMonth, hideValues)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Total Dívidas Restantes:</span>
              <span className="text-sm sm:text-base font-bold text-rose-400">
                {formatCurrency(totalRemainingDebt, hideValues)}
              </span>
            </div>
          </div>

          {/* Lista de Próximos Vencimentos */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Próximos Vencimentos:
            </span>
            {upcomingBills.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhum parcelamento ativo pendente.</p>
            ) : (
              upcomingBills.map((bill) => {
                const currentInstNumber = bill.paid_installments_count + 1;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-2xl text-xs hover:bg-slate-800/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{bill.description}</p>
                      <span className="text-[10px] text-slate-400">
                        Parcela {currentInstNumber}/{bill.total_installments} • Vence dia {bill.due_day}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">
                        {formatCurrency(bill.installment_amount, hideValues)}
                      </span>
                      <span className="text-[10px] text-slate-500">{bill.card_name || 'Cartão'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gráfico de Gastos por Categoria */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <PieIcon className="w-4 h-4 text-blue-400" />
                Gastos por Categoria
              </div>
            </div>

            {pieData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs text-center border border-dashed border-slate-800 rounded-2xl">
                <AlertTriangle className="w-5 h-5 mb-1 text-slate-600" />
                Nenhuma despesa registrada neste mês ainda.
              </div>
            ) : (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        hideValues ? '••••••••' : formatCurrency(Number(val)),
                        'Gasto',
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Barra Visual: Planejado x Realizado */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Progresso do Orçamento</span>
              <span className="font-semibold text-white">
                {plannedTotalExpense > 0
                  ? `${Math.round((totalExpense / plannedTotalExpense) * 100)}% consumido`
                  : 'Sem meta definida'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthStatus === 'green'
                    ? 'bg-emerald-500'
                    : healthStatus === 'yellow'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    plannedTotalExpense > 0 ? (totalExpense / plannedTotalExpense) * 100 : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
