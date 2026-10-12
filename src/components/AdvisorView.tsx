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
  PieChart,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Zap,
  ShoppingBag,
  Scissors,
  ChevronRight,
  ShieldCheck,
  Send,
  User,
  Bot,
} from 'lucide-react';

interface PracticalAction {
  category: string;
  tip: string;
  savingsEstimate: string;
  howTo: string[];
}

export const AdvisorView: React.FC<{ onNavigateTo: (tab: string) => void }> = ({ onNavigateTo }) => {
  const { transactions, installments, activeMonth, getPlanForMonth } = useData();

  const currentPlan = getPlanForMonth(activeMonth);
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(activeMonth));

  // Cálculo de receitas e despesas
  const totalIncome = currentMonthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInvested = currentMonthTxs.filter((t) => t.type === 'investment').reduce((s, t) => s + t.amount, 0);

  // Gastos por categoria no mês atual
  const currentCatMap: Record<string, { total: number; count: number; items: { desc: string; amount: number }[] }> = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      if (!currentCatMap[t.category]) {
        currentCatMap[t.category] = { total: 0, count: 0, items: [] };
      }
      currentCatMap[t.category].total += t.amount;
      currentCatMap[t.category].count += 1;
      currentCatMap[t.category].items.push({ desc: t.description, amount: t.amount });
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

  // Ordenar categorias pelo maior valor gasto
  const sortedCategories = Object.entries(currentCatMap).sort((a, b) => b[1].total - a[1].total);
  const topCategories = sortedCategories.slice(0, 3);
  const highestCategory = sortedCategories[0] || null;

  // Categoria que mais aumentou em relação ao mês passado
  let maxIncreaseCategory = '';
  let maxIncreaseAmount = 0;
  let maxIncreasePct = 0;

  Object.entries(currentCatMap).forEach(([cat, data]) => {
    const prevAmount = prevCatMap[cat] || 0;
    if (prevAmount > 0) {
      const diff = data.total - prevAmount;
      if (diff > maxIncreaseAmount) {
        maxIncreaseAmount = diff;
        maxIncreaseCategory = cat;
        maxIncreasePct = Math.round((diff / prevAmount) * 100);
      }
    }
  });

  // Parcelas ativas
  const activeInstallments = installments.filter((i) => i.paid_installments_count < i.total_installments);
  const totalInstallmentMonthly = activeInstallments.reduce((s, i) => s + i.installment_amount, 0);

  // Meta de investimento
  const plannedInvest = currentPlan.planned_investment || 0;
  const currentDisposable = Math.max(0, totalIncome - totalExpense);
  const metaCumprida = totalInvested >= plannedInvest && plannedInvest > 0;

  // Dicionário de Estratégias Práticas de Economia personalizadas por Categoria
  const CATEGORY_STRATEGIES: Record<string, { tips: string[]; estimate: string; action: string }> = {
    'Alimentação / Restaurante': {
      estimate: 'Economia estimada: 25% a 35% ao mês',
      action: 'Cortar pedidos por aplicativos e preparar refeições planejadas da semana.',
      tips: [
        'Faça "Meal Prep" (marmitas congeladas para a semana): reduz até R$ 400 por pessoa.',
        'Limite delivery para apenas 1 refeição no fim de semana.',
        'Evite compras por impulso em lanches rápidos e cafeterias no dia a dia.',
      ],
    },
    'Mercado': {
      estimate: 'Economia estimada: 15% a 25% ao mês',
      action: 'Lista fechada antes de sair de casa e trocar marcas líderes por marcas próprias.',
      tips: [
        'Vá ao mercado apenas 1 ou 2 vezes ao mês com lista rigorosa de reposição.',
        'Compre itens não perecíveis em atacarejos (arroz, feijão, papelaria, limpeza).',
        'Nunca vá com fome ao supermercado para evitar compras de impulso.',
      ],
    },
    'Moradia': {
      estimate: 'Economia estimada: R$ 80 a R$ 250 nas contas de consumo',
      action: 'Auditoria de tarifas e consumo elétrico/água.',
      tips: [
        'Verifique lâmpadas LED e aparelhos em modo stand-by (carregadores na tomada consomem).',
        'Conteste aumentos de condomínio e revise planos de IPTU/seguro residencial.',
      ],
    },
    'Transporte': {
      estimate: 'Economia estimada: 20% a 30% em combustível ou tarifas',
      action: 'Otimizar trajetos e combinar caronas ou transporte público.',
      tips: [
        'Abasteça sempre no mesmo dia de desconto do posto ou use apps com cashback (Shell Box, Premmia).',
        'Em trajetos curtos (até 2km), prefira caminhar para economizar gasolina e estacionamento.',
      ],
    },
    'Lazer': {
      estimate: 'Economia estimada: 30% a 50%',
      action: 'Definir uma verba semanal em dinheiro vivo para lazer.',
      tips: [
        'Saque o valor estipulado no início do mês: quando acabar o dinheiro em nota, encerram-se os passeios pagos.',
        'Aproveite opções de lazer gratuitas como parques, praças e eventos culturais da cidade.',
      ],
    },
    'Contas / Boletos': {
      estimate: 'Economia estimada: R$ 100 a R$ 300 mensais',
      action: 'Renegociar planos de internet, celular e assinaturas.',
      tips: [
        'Ligue para a operadora de internet e celular pedindo cancelamento: eles sempre oferecem pacotes 30% mais baratos para reter.',
        'Cancele assinaturas de streaming que você não assistiu nos últimos 15 dias.',
      ],
    },
  };

  // Gerador de diagnóstico de onde está gastando mais e como melhorar
  const getTopExpenseAnalysis = () => {
    if (!highestCategory) {
      return {
        title: 'Sem despesas cadastradas ainda',
        description: 'Cadastre suas despesas no Extrato ou no Início para a IA diagnosticar seus padrões de consumo.',
        strategies: [],
      };
    }

    const catName = highestCategory[0];
    const amount = highestCategory[1].total;
    const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    const customStrategy = CATEGORY_STRATEGIES[catName] || {
      estimate: 'Economia estimada: 15% a 30%',
      action: 'Estabelecer um teto fixo semanal para esta categoria no planejamento.',
      tips: [
        'Divida o orçamento desta categoria por 4 semanas e não ultrapasse a cota semanal.',
        'Antes de qualquer gasto acima de R$ 50, faça a pergunta: "Eu realmente preciso disso agora ou posso esperar 3 dias?".',
      ],
    };

    return {
      catName,
      amount,
      pct,
      customStrategy,
    };
  };

  const topAnalysis = getTopExpenseAnalysis();

  // Oportunidades personalizadas de Renda Extra
  const rendaExtraList = [
    {
      title: '1. Venda de Itens Parados (R$ 300 a R$ 1.500 imediatos)',
      category: 'Início Rápido',
      badge: 'Sem investimento',
      desc: 'Faça um "garimpo" no seu quarto e na casa por roupas em bom estado, sapatos, celulares antigos, livros e móveis que não usa mais.',
      steps: [
        'Tire fotos com boa luz e anuncie na OLX, Enjoei e no Facebook Marketplace da sua região.',
        'O dinheiro entra direto na sua conta via PIX no mesmo dia da entrega.',
        'Destine 100% dessa renda para quitar parcelas ou iniciar sua Reserva de Emergência.',
      ],
    },
    {
      title: '2. Freelance e Prestação de Serviços (R$ 400 a R$ 1.800/mês)',
      category: 'Habilidades Pessoais',
      badge: 'Alta demanda',
      desc: 'Use habilidades que você já possui para prestar serviços nos finais de semana ou à noite.',
      steps: [
        'Edição de fotos/vídeos para lojistas locais, criação de posts para redes sociais no Canva.',
        'Digitação, transcrição de áudios, tradução ou revisão de trabalhos acadêmicos (sites: Workana, 99Freelas).',
        'Aulas particulares online ou reforço escolar para filhos de vizinhos e amigos.',
      ],
    },
    {
      title: '3. Alimentação Caseira & Encomendas (R$ 300 a R$ 1.200/mês)',
      category: 'Comércio Local',
      badge: 'Retorno semanal',
      desc: 'Comidas têm giro rápido e lucro entre 50% a 100% por unidade.',
      steps: [
        'Marmitas congeladas saudáveis, bolos de pote, doces para festas ou salgados sob encomenda.',
        'Divulgue no WhatsApp para colegas de trabalho, vizinhos do condomínio e familiares.',
        'Comece com encomendas antecipadas com 50% de sinal para não gastar do seu bolso.',
      ],
    },
    {
      title: '4. Pet Sitter / Cuidador de Animais (R$ 200 a R$ 800/mês)',
      category: 'Serviços de Bairro',
      badge: 'Fins de semana e feriados',
      desc: 'Muitos donos viajam ou trabalham fora o dia todo e precisam de alguém de confiança para passear com cães ou alimentar gatos.',
      steps: [
        'Cadastre-se na DogHero ou ofereça diretamente para vizinhos do prédio ou condomínio.',
        'Cobrança média: R$ 35 a R$ 60 por passeio ou visita diária de 40 minutos.',
      ],
    },
  ];

  // Chat interativo rápido com o Consultor IA
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ia'; text: string }[]>([
    {
      sender: 'ia',
      text: `Olá! Sou seu Consultor Financeiro. Analisei os seus lançamentos deste mês: você gastou ${formatCurrency(
        totalExpense
      )}${
        highestCategory
          ? `, sendo ${highestCategory[0]} a categoria mais pesada (${formatCurrency(highestCategory[1].total)}).`
          : '.'
      } Clique nas perguntas abaixo ou digite sua dúvida para eu te orientar passo a passo!`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');

  const handleAskQuick = (pergunta: string) => {
    let resposta = '';
    const p = pergunta.toLowerCase();

    if (p.includes('gastando mais') || p.includes('onde gasto')) {
      if (!highestCategory) {
        resposta = 'Você ainda não registrou despesas neste mês. Vá na aba "Extrato" ou "Início" e adicione seus gastos para eu te dar o diagnóstico exato.';
      } else {
        const pct = totalExpense > 0 ? Math.round((highestCategory[1].total / totalExpense) * 100) : 0;
        resposta = `Seu maior ralo de dinheiro hoje é em **${highestCategory[0]}**, consumindo **${formatCurrency(
          highestCategory[1].total
        )}** (${pct}% de tudo o que você gastou). Para começar a melhorar hoje: estabeleça um teto de gastos por semana para essa área e corte pelo menos 20% das compras supérfluas dela.`;
      }
    } else if (p.includes('como melhorar') || p.includes('reduzir')) {
      if (highestCategory && CATEGORY_STRATEGIES[highestCategory[0]]) {
        const strat = CATEGORY_STRATEGIES[highestCategory[0]];
        resposta = `Para reduzir seu gasto principal em **${highestCategory[0]}** (${strat.estimate}):\n1. ${strat.tips[0]}\n2. ${strat.tips[1]}\n3. Utilize a regra dos 3 dias: espere 72h antes de comprar qualquer item não essencial.`;
      } else {
        resposta = `O plano de ouro para melhorar seus gastos:\n1. Aplique a Regra 55/30/10/5 na aba "Planejar".\n2. Audite seus boletos fixos (ligue para a operadora de internet e celular pedindo desconto).\n3. Guarde o valor do investimento assim que o salário cair, e não no final do mês.`;
      }
    } else if (p.includes('renda extra') || p.includes('ganhar mais')) {
      resposta = `As 3 melhores fontes de renda extra para você ativar agora:\n1. **Desapego rápido**: Venda eletrônicos e roupas paradas na OLX/Marketplace (dinheiro entra na hora via PIX).\n2. **Prestação de serviços no tempo livre**: Aulas, edição, doces sob encomenda ou cuidados com pets.\n3. **Trabalhos pontuais de fim de semana**: Eventos, freelas remotos pela internet (Workana/99Freelas). Toda renda extra deve ser usada para quitar dívidas e montar sua reserva!`;
    } else {
      resposta = `Analisando suas finanças: Suas despesas totais somam ${formatCurrency(totalExpense)} contra ${formatCurrency(
        totalIncome
      )} de receitas. Seu foco principal deve ser manter o custo de vida abaixo de 80% do que você ganha, usando a folga para reserva e seus sonhos!`;
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: pergunta },
      { sender: 'ia', text: resposta },
    ]);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;
    const q = inputQuestion;
    setInputQuestion('');
    handleAskQuick(q);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Banner Principal da IA */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/80 to-slate-900 border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-emerald-400 text-slate-950 rounded-2xl shadow-lg shadow-blue-500/20 font-black">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-1 border border-emerald-500/20">
                IA Financeira Ativa • Mês de {getMonthName(activeMonth)}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Onde Você Gasta Mais & Como Melhorar
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Diagnóstico inteligente, estratégias de corte cirúrgico e ideias práticas de renda extra.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400">Total Despesas:</span>
            <span className="text-base font-black text-rose-400">{formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: ONDE VOCÊ ESTÁ GASTANDO MAIS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">1. Onde você está gastando mais</h2>
              <p className="text-xs text-slate-400">Raio-x dos maiores vilões do seu orçamento este mês</p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
            {topCategories.length} categorias em destaque
          </span>
        </div>

        {highestCategory ? (
          <div className="space-y-4">
            {/* Destaque Maior Categoria */}
            <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                  Maior Ralo de Dinheiro Atual:
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{highestCategory[0]}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Consumiu <span className="text-rose-400 font-bold">{formatCurrency(highestCategory[1].total)}</span>, o que equivale a{' '}
                  <span className="text-rose-300 font-extrabold">{topAnalysis.pct}% de todas as suas saídas</span>.
                </p>
              </div>
              <div className="text-left sm:text-right p-3 bg-slate-900/90 rounded-xl border border-slate-800 w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 block uppercase">Quantidade de compras:</span>
                <span className="text-lg font-bold text-white">{highestCategory[1].count} lançamentos</span>
              </div>
            </div>

            {/* Ranking Top 3 Maiores Categorias */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topCategories.map(([cat, data], idx) => {
                const pct = totalExpense > 0 ? Math.round((data.total / totalExpense) * 100) : 0;
                return (
                  <div key={cat} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1} Categoria</span>
                      <span className="text-xs font-black text-rose-400">{pct}%</span>
                    </div>
                    <span className="text-sm font-bold text-white block truncate">{cat}</span>
                    <span className="text-base font-black text-rose-300 block mt-1">
                      {formatCurrency(data.total)}
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Você ainda não registrou despesas neste mês. Adicione seus lançamentos para a IA calcular onde está gastando mais.
          </div>
        )}
      </div>

      {/* SEÇÃO 2: COMO FAZER PARA MELHORAR ESSES GASTOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">2. Como fazer para melhorar esses gastos</h2>
              <p className="text-xs text-slate-400">Plano de ação e passos práticos para estancar o ralo financeiro</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            Ação Imediata
          </span>
        </div>

        {highestCategory && topAnalysis.customStrategy ? (
          <div className="p-5 bg-gradient-to-br from-slate-950 to-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Estratégia Recomendada para "{highestCategory[0]}":
                </span>
                <p className="text-sm font-bold text-white mt-0.5">{topAnalysis.customStrategy.action}</p>
              </div>
              <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-xs">
                {topAnalysis.customStrategy.estimate}
              </span>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">3 Regras de ouro para aplicar hoje:</span>
              <ul className="space-y-2">
                {topAnalysis.customStrategy.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* 4 Pilares Universais de Redução */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Regra das 72 Horas
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Antes de comprar qualquer item não essencial acima de R$ 50, espere 3 dias inteiros. Em mais de 80% das vezes, o desejo impulsivo desaparece e o dinheiro fica com você.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Dividir por 4 Semanas
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pegue o total que você pode gastar no mês em Mercado e Lazer e divida por 4. Não permita que o gasto da semana ultrapasse a cota semanal estipulada.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <Scissors className="w-4 h-4" /> Faxina de Assinaturas
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ligue para sua operadora de internet e celular agora mesmo e peça redução do plano ou ameace cancelar. As empresas sempre reduzem de R$ 30 a R$ 80 a fatura mensal.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Método 55/30/10/5
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mantenha o Essencial em no máximo 55% da renda, Boletos/Metas em 30%, Lazer Livre em 10% e Educação/Futuro em 5%. Ajuste isso na aba "Planejar".
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: COMO FAZER RENDA EXTRA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">3. Ideias Práticas para Fazer Renda Extra</h2>
              <p className="text-xs text-slate-400">
                Quando cortar gastos chega no limite, aumentar a renda é a alavanca mais rápida para ter paz financeira
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            R$ 300 a R$ 1.800/mês
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rendaExtraList.map((item, idx) => (
            <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{item.category}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">Como começar passo a passo:</span>
                  {item.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                      <span className="text-emerald-400 font-black">•</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 4: CONVERSE COM SEU CONSULTOR FINANCEIRO IA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Tire Dúvidas Diretas com a IA</h2>
            <p className="text-xs text-slate-400">Pergunte qualquer coisa sobre como economizar ou fazer mais dinheiro</p>
          </div>
        </div>

        {/* Botões Rápidos */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAskQuick('Onde estou gastando mais e como cortar?')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            Onde estou gastando mais?
          </button>
          <button
            type="button"
            onClick={() => handleAskQuick('Como faço para melhorar meus gastos este mês?')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            Como melhorar meus gastos?
          </button>
          <button
            type="button"
            onClick={() => handleAskQuick('Quais são as melhores ideias de renda extra para mim?')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            Ideias de renda extra
          </button>
        </div>

        {/* Histórico do Chat */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ia' && (
                <div className="w-7 h-7 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0 text-xs font-bold">
                  IA
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xs font-bold">
                  Você
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input para Perguntas Livres */}
        <form onSubmit={handleSendCustom} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Digite sua pergunta (Ex: Como economizar no supermercado?)..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Botão de Redirecionamento para Planejamento */}
      <div className="p-5 bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Pronto para colocar as orientações em prática?</h4>
          <p className="text-xs text-slate-400">
            Ajuste seu orçamento com a regra "Primeiro decidir, depois gastar".
          </p>
        </div>
        <button
          onClick={() => onNavigateTo('planejamento')}
          className="py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
        >
          Ir para Planejamento do Mês
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
