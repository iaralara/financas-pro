import React, { useState } from 'react';
import { useData } from '../context/FinanceContext';
import { MonthlyPlan } from '../types';
import { formatCurrency, getMonthName } from '../utils/formatters';
import {
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const MonthClosingView: React.FC = () => {
  const { activeMonth, setActiveMonth, transactions, getPlanForMonth, saveMonthlyPlan } = useData();

  const currentPlan = getPlanForMonth(activeMonth);

  // Estados locais das perguntas de reflexão e lições aprendidas
  const [wentWell, setWentWell] = useState(currentPlan.reflection_went_well || '');
  const [wentWrong, setWentWrong] = useState(currentPlan.reflection_went_wrong || '');
  const [overspent, setOverspent] = useState(currentPlan.reflection_overspent || '');
  const [habitsKeep, setHabitsKeep] = useState(currentPlan.reflection_habits_keep || '');
  const [habitsAvoid, setHabitsAvoid] = useState(currentPlan.reflection_habits_avoid || '');
  const [lessonsLearned, setLessonsLearned] = useState(currentPlan.lessons_learned || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Transações do mês selecionado
  const monthTxs = transactions.filter((t) => t.date.startsWith(activeMonth));

  const totalIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInvested = monthTxs.filter((t) => t.type === 'investment').reduce((s, t) => s + t.amount, 0);

  // Dívidas/parcelas pagas registradas neste mês
  const paidDebtTxs = monthTxs.filter(
    (t) => t.type === 'expense' && (t.category.toLowerCase().includes('dívida') || t.installment_id)
  );
  const totalDebtPaid = paidDebtTxs.reduce((s, t) => s + t.amount, 0);

  const finalBalance = totalIncome - totalExpense - totalInvested;

  // Planejado
  const plannedIncome = currentPlan.expected_income || 0;
  const plannedExpense =
    (currentPlan.fixed_expenses || 0) +
    (currentPlan.expected_expenses || 0) +
    (currentPlan.installments_due || 0);
  const plannedInvest = currentPlan.planned_investment || 0;

  // Gastos por categoria
  const catExpenses: Record<string, number> = {};
  monthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
    });

  // Geração de Análise Automática Inteligente
  const autoInsights: string[] = [];

  if (plannedExpense > 0 && totalExpense > plannedExpense) {
    const excessPct = Math.round(((totalExpense - plannedExpense) / plannedExpense) * 100);
    const excessVal = totalExpense - plannedExpense;
    autoInsights.push(
      `Você gastou ${excessPct}% acima do planejado no total (excesso de ${formatCurrency(
        excessVal
      )}). Considere reduzir gastos variáveis no próximo mês.`
    );
  } else if (plannedExpense > 0) {
    const savedPct = Math.round(((plannedExpense - totalExpense) / plannedExpense) * 100);
    autoInsights.push(
      `Parabéns! Suas despesas ficaram ${savedPct}% abaixo do teto planejado. Excelente disciplina!`
    );
  }

  // Maior categoria de gasto
  const sortedCategories = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, topVal] = sortedCategories[0];
    const topPct = totalExpense > 0 ? Math.round((topVal / totalExpense) * 100) : 0;
    autoInsights.push(
      `Sua principal categoria de gasto foi "${topCat}", consumindo ${topPct}% (${formatCurrency(
        topVal
      )}) do total de despesas.`
    );
  }

  if (totalInvested >= plannedInvest && plannedInvest > 0) {
    autoInsights.push(`Meta de investimentos cumprida! Você destinou ${formatCurrency(totalInvested)} para o seu futuro.`);
  } else if (plannedInvest > 0) {
    const deficit = plannedInvest - totalInvested;
    autoInsights.push(
      `Atenção aos investimentos: você aportou ${formatCurrency(deficit)} a menos do que a meta estipulada.`
    );
  }

  // Comparação Planejado x Realizado no gráfico
  const comparisonData = [
    { name: 'Receitas', Planejado: plannedIncome, Realizado: totalIncome },
    { name: 'Despesas', Planejado: plannedExpense, Realizado: totalExpense },
    { name: 'Investimentos', Planejado: plannedInvest, Realizado: totalInvested },
  ];

  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlan: MonthlyPlan = {
      ...currentPlan,
      month_year: activeMonth,
      reflection_went_well: wentWell,
      reflection_went_wrong: wentWrong,
      reflection_overspent: overspent,
      reflection_habits_keep: habitsKeep,
      reflection_habits_avoid: habitsAvoid,
      lessons_learned: lessonsLearned,
    };
    await saveMonthlyPlan(updatedPlan);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Fechamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Auditoria & Avaliação
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white capitalize">
              Fechamento do Mês: {getMonthName(activeMonth)}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Avalie onde o dinheiro foi investido ou desperdiçado para ajustar o próximo ciclo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Indicadores Finais do Mês */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Receita Total</span>
          <p className="text-base sm:text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Despesas Realizadas</span>
          <p className="text-base sm:text-lg font-bold text-rose-400">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Investimentos</span>
          <p className="text-base sm:text-lg font-bold text-blue-400">{formatCurrency(totalInvested)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Dívidas/Parcelas Pagas</span>
          <p className="text-base sm:text-lg font-bold text-amber-400">{formatCurrency(totalDebtPaid)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-400 block mb-1">Saldo Final</span>
          <p
            className={`text-base sm:text-lg font-bold ${
              finalBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatCurrency(finalBalance)}
          </p>
        </div>
      </div>

      {/* Análise Inteligente Gerada pelo Sistema */}
      {autoInsights.length > 0 && (
        <div className="bg-blue-950/30 border border-blue-500/40 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            Diagnóstico do Consultor para este Fechamento:
          </div>
          <ul className="space-y-2">
            {autoInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gráfico Comparativo: Planejado x Realizado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Comparação Visual: Planejado x Realizado
        </h2>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Legend />
              <Bar dataKey="Planejado" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realizado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gastos por Categoria no Fechamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Detalhamento de Gastos por Categoria
        </h2>
        {sortedCategories.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Sem despesas registradas neste mês.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sortedCategories.map(([cat, val]) => {
              const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-200">{cat}</span>
                    <span className="font-bold text-white">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">{pct}% do total gasto</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Perguntas para Reflexão & Lições do Mês */}
      <form onSubmit={handleSaveClosing} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Reflexão Financeira & Lições do Mês</h2>
        </div>
        <p className="text-xs text-slate-400">
          Responder com sinceridade é o que transforma o hábito financeiro para o próximo mês.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-1">
              O que deu certo neste mês?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Consegui cozinhar mais em casa, paguei os cartões em dia..."
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-400 mb-1">
              O que deu errado?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Comprei itens parcelados sem planejar, gastei muito com Uber..."
              value={wentWrong}
              onChange={(e) => setWentWrong(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-400 mb-1">
              Onde gastei mais do que deveria e quais foram desnecessários?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Restaurantes caros e assinaturas que não utilizo..."
              value={overspent}
              onChange={(e) => setOverspent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-400 mb-1">
              Qual hábito devo MANTER e qual devo EVITAR?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Manter: guardar o dinheiro no dia do salário. Evitar: navegar em sites de compra no tédio."
              value={habitsKeep}
              onChange={(e) => setHabitsKeep(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1">
            Lições do Mês (O que preciso ajustar no próximo mês?)
          </label>
          <textarea
            rows={3}
            placeholder="Resumo das lições aprendidas e regras para o próximo planejamento..."
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold">
              Lições do mês salvas com sucesso!
            </span>
          )}
          <button
            type="submit"
            className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Salvar Fechamento & Lições
          </button>
        </div>
      </form>
    </div>
  );
};
