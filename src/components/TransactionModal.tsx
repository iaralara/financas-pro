import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { X, Check, Trash2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'user_id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
}

const CATEGORIES_BY_TYPE: Record<TransactionType, string[]> = {
  income: ['Salário', 'Freelance / Renda Extra', 'Investimentos', 'Venda', 'Presente', 'Outros'],
  expense: ['Moradia', 'Mercado', 'Alimentação / Restaurante', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Contas / Boletos', 'Outros'],
  investment: ['Tesouro Direto', 'Ações / FIIs', 'CDB / Renda Fixa', 'Cripto', 'Reserva de Emergência', 'Previdência'],
  transfer: ['Entre Contas Próprias', 'Poupança', 'Outros'],
};

const PAYMENT_METHODS: PaymentMethod[] = ['PIX', 'Débito', 'Dinheiro', 'Cartão de crédito', 'Boleto', 'Outros'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [source, setSource] = useState(initialData?.source || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || 'Mercado');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.payment_method || 'PIX');
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      description,
      amount: parsedAmount,
      type,
      category,
      date,
      payment_method: paymentMethod,
      notes,
      source: type === 'income' ? source : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-white mb-4">
          {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
        </h2>

        {/* Seleção do Tipo */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/60 rounded-xl mb-4 border border-slate-800">
          {(['expense', 'income', 'investment', 'transfer'] as TransactionType[]).map((t) => {
            const labels: Record<TransactionType, string> = {
              expense: 'Despesa',
              income: 'Receita',
              investment: 'Investimento',
              transfer: 'Transf.',
            };
            const activeColors: Record<TransactionType, string> = {
              expense: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
              income: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              investment: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
              transfer: 'bg-slate-700 text-slate-200 border-slate-600',
            };

            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory(CATEGORIES_BY_TYPE[t][0]);
                }}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  isSelected ? activeColors[t] : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {type === 'income' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  De onde vem o valor? (Origem / Pagador)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empresa X, Cliente João, Venda de Carro..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Do que é o valor? (Referência / Motivo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salário mensal, Comissão, Venda de produto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Aluguel, Supermercado, Combustível"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES_BY_TYPE[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observação (Opcional)</label>
            <input
              type="text"
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialData.id);
                  onClose();
                }}
                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition-colors"
                title="Excluir Lançamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
