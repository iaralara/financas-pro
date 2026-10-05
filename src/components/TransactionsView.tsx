import React, { useState } from 'react';
import { useData } from '../context/FinanceContext';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { TransactionModal } from './TransactionModal';

export const TransactionsView: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, activeMonth } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>(activeMonth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Categorias únicas existentes
  const existingCategories = Array.from(new Set(transactions.map((t) => t.category)));
  const existingPayments = ['PIX', 'Débito', 'Dinheiro', 'Cartão de crédito', 'Boleto', 'Outros'];

  // Filtragem dos registros
  const filteredTransactions = transactions.filter((tx) => {
    // Busca por texto
    if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filtro por tipo
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }
    // Filtro por categoria
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
      return false;
    }
    // Filtro por forma de pagamento
    if (selectedPayment !== 'all' && tx.payment_method !== selectedPayment) {
      return false;
    }
    // Filtro por mês
    if (monthFilter && !tx.date.startsWith(monthFilter)) {
      return false;
    }

    return true;
  });

  const getTxTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return (
          <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
            <ArrowUpRight className="w-3.5 h-3.5" /> Receita
          </div>
        );
      case 'expense':
        return (
          <div className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
            <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
          </div>
        );
      case 'investment':
        return (
          <div className="flex items-center gap-1 text-blue-400 font-semibold text-xs">
            <PiggyBank className="w-3.5 h-3.5" /> Investimento
          </div>
        );
      case 'transfer':
        return (
          <div className="flex items-center gap-1 text-slate-300 font-semibold text-xs">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transferência
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
            Extrato & Lançamentos
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Receitas e Despesas</h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle detalhado de entradas, despesas, aportes e transferências.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtro por Mês */}
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
            />
            {monthFilter && (
              <button
                onClick={() => setMonthFilter('')}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
              >
                Todos meses
              </button>
            )}
          </div>
        </div>

        {/* Seletores rápidos: Tipo, Categoria, Pagamento */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
            <option value="investment">Investimentos</option>
            <option value="transfer">Transferências</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas Categorias</option>
            {existingCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas Formas de Pgto</option>
            {existingPayments.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>{filteredTransactions.length} registros encontrados</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
            Nenhuma transação encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isNegative = tx.type === 'expense';
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : isNegative
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {tx.type === 'income' && <ArrowUpRight className="w-4 h-4" />}
                    {tx.type === 'expense' && <ArrowDownRight className="w-4 h-4" />}
                    {tx.type === 'investment' && <PiggyBank className="w-4 h-4" />}
                    {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{tx.description}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {tx.source && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-md text-[10px]">
                          Origem: {tx.source}
                        </span>
                      )}
                      <span className="font-medium text-slate-300">{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="text-slate-500">{tx.payment_method}</span>
                    </div>
                    {tx.notes && <p className="text-[10px] text-slate-500 mt-0.5">{tx.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        isIncome ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-blue-400'
                      }`}
                    >
                      {isNegative ? '- ' : isIncome ? '+ ' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                    <span className="block">{getTxTypeBadge(tx.type)}</span>
                  </div>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                    <button
                      onClick={() => {
                        setEditingTx(tx);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSave={(data) => {
          if (editingTx) {
            updateTransaction(editingTx.id, data);
          } else {
            addTransaction(data);
          }
        }}
        onDelete={(id) => deleteTransaction(id)}
        initialData={editingTx}
      />
    </div>
  );
};
