import React, { useState } from 'react';
import { useData } from '../context/FinanceContext';
import { formatCurrency, getMonthName } from '../utils/formatters';
import {
  Sparkles,
  TrendingDown,
  AlertOctagon,
  Lightbulb,
  DollarSign,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';

export const AdvisorView: React.FC<{ onNavigateTo: (tab: string) => void }> = ({ onNavigateTo }) => {
  const { transactions, installments, activeMonth, getPlanForMonth } = useData();

  const currentPlan = getPlanForMonth(activeMonth);
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(activeMonth));

  // Cálculo de receitas e despesas
  const totalIncome = currentMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInvested = currentMonthTxs.filter((t) => t.type === 'investment').reduce((s, t) => s + t.amount, 0);

  // Gastos por categoria no mês atual
  const currentCatMap: Record<string, number> = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      currentCatMap[t.category] = (currentCatMap[t.category] || 0) + t.amount;
    });

  // Gastos do mês anterior para comparação precisa
  const [yearStr, monthStr] = activeMonth.split('-');
  const prevDate = new Date(parseInt(yearStr), parseInt(monthStr) - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTxs = transactions.filter((t) => t.date.startsWith(prevMonthStr));
  const prevCatMap: Record<string, number> = {};
  prevMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      prevCatMap[t.category] = (prevCatMap[t.category] || 0) + t.amount;
    });

  // 1. Onde estou gastando demais?
  const sortedCategories = Object.entries(currentCatMap).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories[0] || null;

  // 2. Qual categoria aumentou em relação ao mês anterior?
  let maxIncreaseCategory = '';
  let maxIncreaseAmount = 0;
  let maxIncreasePct = 0;

  Object.entries(currentCatMap).forEach(([cat, currentAmount]) => {
    const prevAmount = prevCatMap[cat] || 0;
    if (prevAmount > 0) {
      const diff = currentAmount - prevAmount;
      if (diff > maxIncreaseAmount) {
        maxIncreaseAmount = diff;
        maxIncreaseCategory = cat;
        maxIncreasePct = Math.round((diff / prevAmount) * 100);
      }
    }
  });

  // 3. Parcelas que comprometem os próximos meses
  const activeInstallments = installments.filter((i) => i.paid_installments_count < i.total_installments);
  const totalInstallmentMonthly = activeInstallments.reduce((s, i) => s + i.installment_amount, 0);

  // 4. Quanto posso investir?
  const plannedInvest = currentPlan.planned_investment || 0;
  const currentDisposable = Math.max(0, totalIncome - totalExpense);

  // 5. Metas do mês
  const metaCumprida = totalInvested >= plannedInvest && plannedInvest > 0;

  // Sugestões de aumento de renda baseadas no perfil real
  const incomeOpportunities = [
    {
      title: 'Monetização de Ativos Parados',
      desc: 'Você possui parcelamentos de bens de consumo duráveis. Verifique eletrônicos ou itens em casa sem uso para vender em plataformas como OLX e Mercado Livre para antecipar quitação de parcelas.',
    },
    {
      title: 'Serviços Especializados / Freelance',
      desc: `Considerando sua despesa de ${formatCurrency(
        totalExpense
      )}, conquistar uma fonte de renda extra pontual de R$ 300 a R$ 600 por mês equilibraria folgadamente sua reserva de emergência.`,
    },
    {
      title: 'Auditoria de Assinaturas e Contas Fixas',
      desc: 'Renegocie planos de internet, telefonia e cancele streamings não assistidos nos últimos 30 dias.',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Banner Consultor */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/40">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/20">
              Consultor Financeiro Pessoal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Diagnóstico Estratégico & Sugestões
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Análise transparente calculada estritamente com base nos dados que você registrou. Sem palpites genéricos.
            </p>
          </div>
        </div>
      </div>

      {/* Respostas Diretas às Dúvidas do Usuário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Onde estou gastando demais? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            Onde estou gastando demais?
          </div>
          <h3 className="text-base font-bold text-white">
            {highestCategory ? highestCategory[0] : 'Nenhuma despesa catalogada'}
          </h3>
          <p className="text-xs text-slate-400">
            {highestCategory ? (
              <>
                Essa categoria consumiu <span className="text-rose-400 font-bold">{formatCurrency(highestCategory[1])}</span>,
                o que representa{' '}
                <span className="font-bold text-white">
                  {totalExpense > 0 ? Math.round((highestCategory[1] / totalExpense) * 100) : 0}%
                </span>{' '}
                de tudo o que você gastou no mês.
              </>
            ) : (
              'Comece a registrar suas despesas para obter o raio-x de excessos.'
            )}
          </p>
        </div>

        {/* Card: Qual categoria aumentou? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            Qual categoria aumentou em relação ao mês anterior?
          </div>
          <h3 className="text-base font-bold text-white">
            {maxIncreaseCategory ? maxIncreaseCategory : 'Estável ou sem histórico anterior'}
          </h3>
          <p className="text-xs text-slate-400">
            {maxIncreaseCategory ? (
              <>
                Subiu <span className="text-amber-400 font-bold">+{formatCurrency(maxIncreaseAmount)}</span> (
                <span className="font-bold text-white">+{maxIncreasePct}%</span>) comparado ao mês anterior (
                {getMonthName(prevMonthStr)}).
              </>
            ) : (
              'Não houve aumento significativo em relação ao mês anterior ou não há dados suficientes.'
            )}
          </p>
        </div>

        {/* Card: Cumprimento de Metas & Investimentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            Estou cumprindo minha meta de investimento?
          </div>
          <h3 className="text-base font-bold text-white">
            {plannedInvest === 0
              ? 'Nenhuma meta de investimento estipulada'
              : metaCumprida
              ? '✅ Sim! Meta atingida com sucesso'
              : '⚠️ Abaixo da meta estabelecida'}
          </h3>
          <p className="text-xs text-slate-400">
            Meta planejada: <span className="font-semibold text-white">{formatCurrency(plannedInvest)}</span> | Realizado até agora:{' '}
            <span className="font-semibold text-blue-400">{formatCurrency(totalInvested)}</span>.
            {totalIncome > totalExpense && !metaCumprida && (
              <span className="block mt-1 text-emerald-400 font-medium">
                Você ainda possui sobra estimada de {formatCurrency(currentDisposable)} disponível para aportar.
              </span>
            )}
          </p>
        </div>

        {/* Card: Parcelas comprometendo os próximos meses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <TrendingDown className="w-4 h-4" />
            Quais parcelas estão comprometendo os próximos meses?
          </div>
          <h3 className="text-base font-bold text-white">
            {activeInstallments.length > 0
              ? `${activeInstallments.length} parcelamentos ativos (${formatCurrency(totalInstallmentMonthly)}/mês)`
              : 'Nenhum parcelamento ativo'}
          </h3>
          <div className="text-xs text-slate-400 space-y-1">
            {activeInstallments.slice(0, 3).map((inst) => (
              <div key={inst.id} className="flex justify-between items-center py-0.5 border-b border-slate-800">
                <span className="text-slate-300">{inst.description}</span>
                <span className="font-semibold text-amber-400">
                  {formatCurrency(inst.installment_amount)} ({inst.total_installments - inst.paid_installments_count}x restantes)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Oportunidades para Aumentar a Renda */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Oportunidades Estratégicas para Aumentar a Renda</h2>
        </div>
        <p className="text-xs text-slate-400">
          Quando o corte de custos atinge o limite do conforto essencial, a única alavanca matemática é expandir os ganhos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {incomeOpportunities.map((op, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">{op.title}</span>
              <p className="text-xs text-slate-300 leading-relaxed">{op.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Redirecionamento para Planejamento */}
      <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Pronto para colocar as orientações em prática?</h4>
          <p className="text-xs text-slate-400">
            Ajuste seu orçamento com a regra "Primeiro decidir, depois gastar".
          </p>
        </div>
        <button
          onClick={() => onNavigateTo('planejamento')}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
        >
          Ir para Planejamento do Mês
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
