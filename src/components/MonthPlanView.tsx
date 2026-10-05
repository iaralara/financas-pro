import React, { useState, useEffect } from 'react';
import { useData } from '../context/FinanceContext';
import { MonthlyPlan, PlannedItem, FinancialGoal, IncomePlanItem } from '../types';
import { formatCurrency, getMonthName } from '../utils/formatters';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Percent,
  Plus,
  Trash2,
  ListPlus,
  Layers,
  Plane,
  Target,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const MonthPlanView: React.FC = () => {
  const { activeMonth, setActiveMonth, getPlanForMonth, saveMonthlyPlan, installments } = useData();

  const currentPlan = getPlanForMonth(activeMonth);

  // Estados locais do formulário de planejamento
  const [availableMoney, setAvailableMoney] = useState(currentPlan.available_money?.toString() || '0');
  
  // Lista de receitas especificadas (De onde vem e do que é)
  const [incomeItems, setIncomeItems] = useState<IncomePlanItem[]>(
    currentPlan.income_items || [
      { id: 'inc_1', source: 'Trabalho Principal', description: 'Salário Mensal', amount: Number(currentPlan.expected_income) || 0 },
    ]
  );

  const [newIncSource, setNewIncSource] = useState('');
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncAmount, setNewIncAmount] = useState('');

  const [plannedInvestment, setPlannedInvestment] = useState(currentPlan.planned_investment?.toString() || '0');
  
  // Metas financeiras / Viagens com aporte mensal
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>(
    currentPlan.goals || [
      {
        id: 'g_1',
        name: 'Viagem 15 anos Bela',
        target_amount: 50000,
        monthly_contribution: 1000,
        current_saved: 0,
      },
    ]
  );

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalMonthly, setNewGoalMonthly] = useState('');
  const [newGoalSaved, setNewGoalSaved] = useState('');
  
  // Itens especificados individualmente
  const [fixedItems, setFixedItems] = useState<PlannedItem[]>(
    currentPlan.fixed_items || [
      { id: '1', name: 'Aluguel / Moradia', amount: 0 },
      { id: '2', name: 'Energia Elétrica', amount: 0 },
      { id: '3', name: 'Internet / Telefone', amount: 0 },
    ]
  );

  const [variableItems, setVariableItems] = useState<PlannedItem[]>(
    currentPlan.variable_items || [
      { id: '1', name: 'Supermercado Mensal', amount: 0 },
      { id: '2', name: 'Transporte / Combustível', amount: 0 },
      { id: '3', name: 'Farmácia / Cuidados', amount: 0 },
    ]
  );

  const [seasonalItems, setSeasonalItems] = useState<PlannedItem[]>(
    currentPlan.seasonal_items || []
  );

  // Novos campos para adicionar item
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');

  const [newVarName, setNewVarName] = useState('');
  const [newVarAmount, setNewVarAmount] = useState('');

  const [newSeasName, setNewSeasName] = useState('');
  const [newSeasAmount, setNewSeasAmount] = useState('');

  const [installmentsDue, setInstallmentsDue] = useState(
    currentPlan.installments_due
      ? currentPlan.installments_due.toString()
      : installments
          .filter((i) => i.paid_installments_count < i.total_installments)
          .reduce((sum, i) => sum + i.installment_amount, 0)
          .toString()
  );
  
  const [goalsText, setGoalsText] = useState(currentPlan.goals_text || '');

  // Percentuais de distribuição (Regra 55/30/10/5)
  const [pctEssential, setPctEssential] = useState(currentPlan.distribution_percentages?.essential ?? 55);
  const [pctBillsGoals, setPctBillsGoals] = useState(currentPlan.distribution_percentages?.bills_goals ?? 30);
  const [pctFree, setPctFree] = useState(currentPlan.distribution_percentages?.free ?? 10);
  const [pctEducation, setPctEducation] = useState(currentPlan.distribution_percentages?.education ?? 5);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cálculos dinâmicos a partir da soma dos itens especificados
  const totalIncomeCalculated = incomeItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const totalFixedCalculated = fixedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const totalVariableCalculated = variableItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const totalSeasonalCalculated = seasonalItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  // Cálculos de Teste de Realidade
  const nAvailable = parseFloat(availableMoney.replace(',', '.')) || 0;
  const nIncome = totalIncomeCalculated;
  const nInvest = parseFloat(plannedInvestment.replace(',', '.')) || 0;
  const nFixed = totalFixedCalculated;
  const nExpected = totalVariableCalculated;
  const nInst = parseFloat(installmentsDue.replace(',', '.')) || 0;
  const nSeasonal = totalSeasonalCalculated;

  // Total de Saídas Previstas
  const totalOutflows = nFixed + nExpected + nInst + nSeasonal + nInvest;

  // Teste de Realidade com Dinheiro Disponível:
  const plannedBalance = nAvailable + nIncome - totalOutflows;
  const planFails = plannedBalance < 0;

  // Gráfico 70/30 e subcategorias
  const totalBase = Math.max(nIncome || nAvailable, 1);
  const distributionData = [
    { name: '55% Essencial', value: (totalBase * pctEssential) / 100, color: '#3b82f6' },
    { name: '30% Boletos / Metas', value: (totalBase * pctBillsGoals) / 100, color: '#10b981' },
    { name: '10% Livre / Lazer', value: (totalBase * pctFree) / 100, color: '#f59e0b' },
    { name: '5% Educação', value: (totalBase * pctEducation) / 100, color: '#8b5cf6' },
  ];

  // Handlers para adicionar itens
  const handleAddIncome = () => {
    if (!newIncSource && !newIncDesc) return;
    const amount = parseFloat(newIncAmount.replace(',', '.')) || 0;
    setIncomeItems([
      ...incomeItems,
      {
        id: `inc_${Date.now()}`,
        source: newIncSource || 'Principal',
        description: newIncDesc || 'Receita',
        amount,
      },
    ]);
    setNewIncSource('');
    setNewIncDesc('');
    setNewIncAmount('');
  };

  const handleRemoveIncome = (id: string) => {
    setIncomeItems(incomeItems.filter((i) => i.id !== id));
  };

  const handleUpdateIncome = (id: string, amount: number) => {
    setIncomeItems(incomeItems.map((i) => (i.id === id ? { ...i, amount } : i)));
  };

  const handleAddFixed = () => {
    if (!newFixedName) return;
    const amount = parseFloat(newFixedAmount.replace(',', '.')) || 0;
    setFixedItems([...fixedItems, { id: `fix_${Date.now()}`, name: newFixedName, amount }]);
    setNewFixedName('');
    setNewFixedAmount('');
  };

  const handleRemoveFixed = (id: string) => {
    setFixedItems(fixedItems.filter((i) => i.id !== id));
  };

  const handleUpdateFixed = (id: string, amount: number) => {
    setFixedItems(fixedItems.map((i) => (i.id === id ? { ...i, amount } : i)));
  };

  const handleAddVar = () => {
    if (!newVarName) return;
    const amount = parseFloat(newVarAmount.replace(',', '.')) || 0;
    setVariableItems([...variableItems, { id: `var_${Date.now()}`, name: newVarName, amount }]);
    setNewVarName('');
    setNewVarAmount('');
  };

  const handleRemoveVar = (id: string) => {
    setVariableItems(variableItems.filter((i) => i.id !== id));
  };

  const handleUpdateVar = (id: string, amount: number) => {
    setVariableItems(variableItems.map((i) => (i.id === id ? { ...i, amount } : i)));
  };

  const handleAddSeas = () => {
    if (!newSeasName) return;
    const amount = parseFloat(newSeasAmount.replace(',', '.')) || 0;
    setSeasonalItems([...seasonalItems, { id: `seas_${Date.now()}`, name: newSeasName, amount }]);
    setNewSeasName('');
    setNewSeasAmount('');
  };

  const handleRemoveSeas = (id: string) => {
    setSeasonalItems(seasonalItems.filter((i) => i.id !== id));
  };

  const handleUpdateSeas = (id: string, amount: number) => {
    setSeasonalItems(seasonalItems.map((i) => (i.id === id ? { ...i, amount } : i)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const planToSave: MonthlyPlan = {
      ...currentPlan,
      month_year: activeMonth,
      available_money: nAvailable,
      expected_income: nIncome,
      planned_investment: nInvest,
      fixed_expenses: nFixed,
      expected_expenses: nExpected,
      installments_due: nInst,
      seasonal_expenses: nSeasonal,
      goals_text: goalsText,
      distribution_percentages: {
        essential: pctEssential,
        bills_goals: pctBillsGoals,
        free: pctFree,
        education: pctEducation,
      },
      income_items: incomeItems,
      fixed_items: fixedItems,
      variable_items: variableItems,
      seasonal_items: seasonalItems,
      goals: financialGoals,
    };

    await saveMonthlyPlan(planToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header com Regra de Ouro */}
      <div className="bg-gradient-to-r from-blue-900/60 to-slate-900 border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
              Regra Principal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              PRIMEIRO DECIDIR. DEPOIS GASTAR.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Especifique cada conta e gasto do mês. Saber exatamente o destino de cada centavo é o segredo do controle financeiro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Entradas e Recursos Disponíveis */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                1. Receitas Previstas: De onde vem e do que é cada valor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Especifique a origem (quem paga) e a descrição (do que se trata: salário, freelance, comissão, etc.)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total de Receitas:</span>
              <span className="text-base font-black text-emerald-400">{formatCurrency(totalIncomeCalculated)}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dinheiro Já Disponível na Conta no Início do Mês (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={availableMoney}
              onChange={(e) => setAvailableMoney(e.target.value)}
              className="w-full sm:w-80 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-base font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Saldo inicial em conta corrente/carteira</span>
          </div>

          {/* Lista de Receitas Especificadas */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Suas Fontes de Renda Previstas ({incomeItems.length}):
            </span>
            {incomeItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {item.description}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Origem: {item.source}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-slate-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount || ''}
                    placeholder="0,00"
                    onChange={(e) => handleUpdateIncome(item.id, parseFloat(e.target.value) || 0)}
                    className="w-28 sm:w-36 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-right text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIncome(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remover receita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Adicionar Nova Receita */}
          <div className="p-3.5 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="De onde vem o valor? (Ex: Empresa X, Cliente Y, Venda)"
              value={newIncSource}
              onChange={(e) => setNewIncSource(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Do que é o valor? (Ex: Salário, Consultoria, Comissão)"
              value={newIncDesc}
              onChange={(e) => setNewIncDesc(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor R$"
              value={newIncAmount}
              onChange={(e) => setNewIncAmount(e.target.value)}
              className="w-full sm:w-28 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 text-right"
            />
            <button
              type="button"
              onClick={handleAddIncome}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Receita
            </button>
          </div>
        </div>

        {/* Prioridade: Construir o Futuro (Investimentos & Metas de Viagens/Sonhos) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                2. Construir o Futuro: Viagens, Sonhos & Investimentos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina sua meta e quanto você vai colocar por mês para chegar lá com precisão.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Aporte Total Mensal em Metas:</span>
              <span className="text-base font-black text-blue-400">
                {formatCurrency(
                  (parseFloat(plannedInvestment.replace(',', '.')) || 0) +
                  financialGoals.reduce((sum, g) => sum + (Number(g.monthly_contribution) || 0), 0)
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reserva de Emergência / Investimentos Gerais do Mês (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={plannedInvestment}
                onChange={(e) => setPlannedInvestment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-base font-bold text-blue-400 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Tesouro Selic, CDB, previdência</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lema / Foco Mental do Mês
              </label>
              <input
                type="text"
                placeholder="Ex: Focar na viagem da Bela sem criar dívidas novas"
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Motivação para guiar suas escolhas</span>
            </div>
          </div>

          {/* Gerenciador de Metas de Viagens & Sonhos */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-blue-400" />
              Suas Metas & Viagens Planejadas ({financialGoals.length})
            </span>

            <div className="grid grid-cols-1 gap-3">
              {financialGoals.map((goal) => {
                const target = Number(goal.target_amount) || 0;
                const monthly = Number(goal.monthly_contribution) || 0;
                const saved = Number(goal.current_saved) || 0;
                const remaining = Math.max(0, target - saved);
                const monthsNeeded = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
                const progressPct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                          <span className="text-xs text-slate-400">
                            Meta total: <span className="text-emerald-400 font-semibold">{formatCurrency(target)}</span> • Já guardado:{' '}
                            <span className="text-blue-300 font-semibold">{formatCurrency(saved)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Colocar Mensalmente:</span>
                          <span className="text-sm font-bold text-blue-400">
                            {formatCurrency(monthly)} / mês
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFinancialGoals(financialGoals.filter((g) => g.id !== goal.id))}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remover meta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Estimativa de Tempo e Barra de Progresso */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <span className="text-slate-300">
                        {monthsNeeded > 0 ? (
                          <>
                            ⏳ Faltam <span className="text-amber-400 font-bold">{monthsNeeded} meses</span> de R$ {monthly.toFixed(2)} para completar o sonho ({formatCurrency(remaining)} restantes).
                          </>
                        ) : (
                          'Informe quanto pode colocar por mês para calcular o tempo até a viagem.'
                        )}
                      </span>
                      <span className="text-emerald-400 font-bold">{progressPct}% atingido</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adicionar Nova Meta / Viagem */}
            <div className="p-4 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-blue-300 block">
                + Adicionar Nova Meta / Viagem com Aporte Mensal:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Nome (Ex: Viagem 15 anos Bela)"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="sm:col-span-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor Total da Meta (R$)"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quanto posso colocar mensal (R$)"
                  value={newGoalMonthly}
                  onChange={(e) => setNewGoalMonthly(e.target.value)}
                  className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Já tenho guardado (R$)"
                  value={newGoalSaved}
                  onChange={(e) => setNewGoalSaved(e.target.value)}
                  className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newGoalName) return;
                  const target = parseFloat(newGoalTarget.replace(',', '.')) || 0;
                  const monthly = parseFloat(newGoalMonthly.replace(',', '.')) || 0;
                  const saved = parseFloat(newGoalSaved.replace(',', '.')) || 0;
                  setFinancialGoals([
                    ...financialGoals,
                    {
                      id: `g_${Date.now()}`,
                      name: newGoalName,
                      target_amount: target,
                      monthly_contribution: monthly,
                      current_saved: saved,
                    },
                  ]);
                  setNewGoalName('');
                  setNewGoalTarget('');
                  setNewGoalMonthly('');
                  setNewGoalSaved('');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Adicionar Meta de Viagem / Sonho
              </button>
            </div>
          </div>
        </div>

        {/* 3. VIVER O PRESENTE: ESPECIFICAR CONTAS FIXAS DO QUE É */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                3. Contas Fixas Detalhadas (Especifique Cada Uma)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dê nome a cada conta: aluguel, luz, condomínio, internet, água, escola, etc.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Contas Fixas:</span>
              <span className="text-base font-black text-rose-400">{formatCurrency(totalFixedCalculated)}</span>
            </div>
          </div>

          {/* Lista de Contas Fixas Especificadas */}
          <div className="space-y-2.5">
            {fixedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-200 flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount || ''}
                    placeholder="0,00"
                    onChange={(e) => handleUpdateFixed(item.id, parseFloat(e.target.value) || 0)}
                    className="w-24 sm:w-32 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-right text-white font-bold focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFixed(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remover conta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Adicionar Nova Conta Fixa */}
          <div className="p-3 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Nome da Conta Fixa (Ex: Plano Celular, Academia...)"
              value={newFixedName}
              onChange={(e) => setNewFixedName(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor R$"
              value={newFixedAmount}
              onChange={(e) => setNewFixedAmount(e.target.value)}
              className="w-full sm:w-28 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-rose-500 text-right"
            />
            <button
              type="button"
              onClick={handleAddFixed}
              className="w-full sm:w-auto px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Conta
            </button>
          </div>
        </div>

        {/* 4. GASTOS VARIÁVEIS DETALHADOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                4. Gastos Variáveis & Rotina
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Previsão de mercado, combustível, farmácia, lazer, delivery, etc.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Variáveis:</span>
              <span className="text-base font-black text-amber-400">{formatCurrency(totalVariableCalculated)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {variableItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-200 flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount || ''}
                    placeholder="0,00"
                    onChange={(e) => handleUpdateVar(item.id, parseFloat(e.target.value) || 0)}
                    className="w-24 sm:w-32 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-right text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVar(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Nome do Gasto Variável (Ex: Lazer de Final de Semana, Roupas...)"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor R$"
              value={newVarAmount}
              onChange={(e) => setNewVarAmount(e.target.value)}
              className="w-full sm:w-28 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-amber-500 text-right"
            />
            <button
              type="button"
              onClick={handleAddVar}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Variável
            </button>
          </div>
        </div>

        {/* 5. GASTOS SAZONAIS & PARCELAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parcelas / Faturas de Cartão com Vencimento no Mês (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={installmentsDue}
                onChange={(e) => setInstallmentsDue(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-base font-bold text-amber-400 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Calculado automaticamente com base nas suas parcelas</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Gastos Sazonais / Ocasionais (IPVA, Aniversários, Viagens)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Aniversário da Mãe"
                  value={newSeasName}
                  onChange={(e) => setNewSeasName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="R$"
                  value={newSeasAmount}
                  onChange={(e) => setNewSeasAmount(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white text-right font-bold focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSeas}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {seasonalItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {seasonalItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-slate-950/60 rounded-xl text-xs">
                      <span className="text-slate-200">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatCurrency(item.amount)}</span>
                        <button type="button" onClick={() => handleRemoveSeas(item.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Método 70/30 e Orçamento Visual */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-400" />
                Método 70/30 & Estrutura Orçamentária
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                70% Viver o Presente • 30% Construir o Futuro
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Gráfico de Pizza Colorido */}
            <div className="h-52 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`dist-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Planejado']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <span className="text-[11px] text-slate-400 mt-1">Divisão com base na receita total</span>
            </div>

            {/* Ajuste de Percentuais */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Personalizar Percentuais da Distribuição:
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Essencial (Moradia, Contas, Mercado)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pctEssential}
                    onChange={(e) => setPctEssential(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Boletos Pessoais / Metas
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pctBillsGoals}
                    onChange={(e) => setPctBillsGoals(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Livre (Lazer e Estilo de Vida)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pctFree}
                    onChange={(e) => setPctFree(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Educação (Cursos, Livros)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pctEducation}
                    onChange={(e) => setPctEducation(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TESTE DE REALIDADE */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border shadow-xl transition-all ${
            planFails
              ? 'bg-rose-950/40 border-rose-500/50'
              : 'bg-emerald-950/30 border-emerald-500/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                planFails ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {planFails ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {planFails ? '⚠️ Seu planejamento não fecha.' : '✅ Teste de Realidade Aprovado!'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl">
                  <span className="text-slate-400 block">Total Recursos:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(nAvailable + nIncome)}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl">
                  <span className="text-slate-400 block">Total Saídas Previstas:</span>
                  <span className="font-bold text-rose-400">{formatCurrency(totalOutflows)}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block">Saldo Planejado:</span>
                  <span className={`font-bold ${plannedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(plannedBalance)}
                  </span>
                </div>
              </div>

              {planFails ? (
                <div className="mt-3 pt-3 border-t border-rose-500/30">
                  <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                    Nunca conte com a sorte. Você tem SOMENTE 3 alternativas viáveis:
                  </p>
                  <ul className="space-y-1.5 text-xs text-rose-200">
                    <li className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      1. Gastar menos (cortar ou renegociar despesas variáveis e fixas).
                    </li>
                    <li className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      2. Mudar algum plano (adiar compras ou reduzir o aporte de investimento temporariamente).
                    </li>
                    <li className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      3. Aumentar a renda (freelances, venda de itens parados ou serviços extras).
                    </li>
                  </ul>
                  <p className="text-[11px] text-rose-400 italic mt-2">
                    "Nunca considere 'vai dar certo' como solução orçamentária."
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-300 mt-1">
                  Seus gastos e investimentos cabem perfeitamente no seu dinheiro disponível. Você começará o mês com controle absoluto!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold animate-fade-in">
              Planejamento detalhado salvo com sucesso!
            </span>
          )}
          <button
            type="submit"
            className="py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Salvar e Confirmar Planejamento
          </button>
        </div>
      </form>
    </div>
  );
};
