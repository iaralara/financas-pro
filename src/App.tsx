import React, { useState } from 'react';
import { useAuth, useData } from './context/FinanceContext';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  ArrowLeftRight,
  CreditCard,
  Sparkles,
  Mic,
  User,
  Plus,
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { MonthPlanView } from './components/MonthPlanView';
import { MonthClosingView } from './components/MonthClosingView';
import { TransactionsView } from './components/TransactionsView';
import { InstallmentsView } from './components/InstallmentsView';
import { AdvisorView } from './components/AdvisorView';
import { AuthModal } from './components/AuthModal';
import { AudioModal } from './components/AudioModal';
import { TransactionModal } from './components/TransactionModal';
import { InstallmentModal } from './components/InstallmentModal';

export const App: React.FC = () => {
  const { user } = useAuth();
  const { addTransaction, addInstallment } = useData();

  // Abas de navegação
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planejamento' | 'fechamento' | 'transacoes' | 'parcelas' | 'consultor'>('dashboard');

  // Modais globais
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isNewInstallmentOpen, setIsNewInstallmentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Navegável */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-blue-500/20">
              $
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
                Finanças<span className="text-emerald-400">Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Consultor Financeiro Pessoal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Gravação de Áudio */}
            <button
              onClick={() => setIsAudioOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-xs"
              title="Lançamento por Voz / Áudio"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voz</span>
            </button>

            {/* Indicador de Espaço Privado e Seguro */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl text-xs shadow-xs"
              title="Seus dados são 100% privados e salvos apenas no seu próprio aparelho."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Privado no seu Celular/PC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenNewTx={() => setIsNewTxOpen(true)}
            onOpenNewInstallment={() => setIsNewInstallmentOpen(true)}
            onNavigateTo={(tab) => setActiveTab(tab as any)}
          />
        )}
        {activeTab === 'planejamento' && <MonthPlanView />}
        {activeTab === 'fechamento' && <MonthClosingView />}
        {activeTab === 'transacoes' && <TransactionsView />}
        {activeTab === 'parcelas' && <InstallmentsView />}
        {activeTab === 'consultor' && <AdvisorView onNavigateTo={(tab) => setActiveTab(tab as any)} />}
      </main>

      {/* Barra de Navegação Inferior (Mobile-First e Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 sm:px-6 py-2">
        <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Início</span>
          </button>

          <button
            onClick={() => setActiveTab('planejamento')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'planejamento' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-5 h-5" />
            <span className="text-[10px]">Planejar</span>
          </button>

          <button
            onClick={() => setActiveTab('transacoes')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'transacoes' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px]">Extrato</span>
          </button>

          <button
            onClick={() => setActiveTab('parcelas')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'parcelas' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">Parcelas</span>
          </button>

          <button
            onClick={() => setActiveTab('fechamento')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'fechamento' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px]">Fechamento</span>
          </button>

          <button
            onClick={() => setActiveTab('consultor')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === 'consultor' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Consultor</span>
          </button>
        </div>
      </nav>

      {/* Modais Globais */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <AudioModal
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        onConfirm={(data) => addTransaction(data)}
      />

      <TransactionModal
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
        onSave={(data) => addTransaction(data)}
      />

      <InstallmentModal
        isOpen={isNewInstallmentOpen}
        onClose={() => setIsNewInstallmentOpen(false)}
        onSave={(data) => addInstallment(data)}
      />
    </div>
  );
};
