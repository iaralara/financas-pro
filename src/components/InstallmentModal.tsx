import React, { useState } from 'react';
import { InstallmentPurchase } from '../types';
import { X, Check, Trash2, CreditCard } from 'lucide-react';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inst: Omit<InstallmentPurchase, 'id' | 'user_id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: InstallmentPurchase | null;
}

const CATEGORIES = [
  'Tecnologia',
  'Eletrodomésticos',
  'Móveis / Casa',
  'Vestuário',
  'Viagem / Turismo',
  'Educação / Cursos',
  'Saúde / Odonto',
  'Veículo / Manutenção',
  'Dívida / Empréstimo',
  'Outros',
];

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [totalAmount, setTotalAmount] = useState(initialData?.total_amount?.toString() || '');
  const [totalInstallments, setTotalInstallments] = useState(initialData?.total_installments?.toString() || '12');
  const [installmentAmount, setInstallmentAmount] = useState(initialData?.installment_amount?.toString() || '');
  const [paidCount, setPaidCount] = useState(initialData?.paid_installments_count?.toString() || '0');
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchase_date || new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState(initialData?.due_day?.toString() || '10');
  const [firstDate, setFirstDate] = useState(initialData?.first_installment_date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialData?.category || 'Tecnologia');
  const [cardName, setCardName] = useState(initialData?.card_name || 'Cartão Principal');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isDebt, setIsDebt] = useState(initialData?.is_debt || false);

  if (!isOpen) return null;

  // Cálculo automático do valor da parcela quando totalAmount ou totalInstallments mudarem
  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    const tot = parseFloat(val.replace(',', '.'));
    const insts = parseInt(totalInstallments);
    if (!isNaN(tot) && insts > 0) {
      setInstallmentAmount((tot / insts).toFixed(2));
    }
  };

  const handleInstallmentsChange = (val: string) => {
    setTotalInstallments(val);
    const tot = parseFloat(totalAmount.replace(',', '.'));
    const insts = parseInt(val);
    if (!isNaN(tot) && insts > 0) {
      setInstallmentAmount((tot / insts).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount.replace(',', '.'));
    const instCount = parseInt(totalInstallments);
    const instVal = parseFloat(installmentAmount.replace(',', '.'));
    const dDay = parseInt(dueDay);
    const paid = parseInt(paidCount) || 0;

    if (!description || isNaN(tot) || isNaN(instCount) || isNaN(instVal) || isNaN(dDay)) return;

    onSave({
      description,
      total_amount: tot,
      total_installments: instCount,
      installment_amount: instVal,
      purchase_date: purchaseDate,
      due_day: dDay,
      first_installment_date: firstDate,
      category,
      card_name: cardName,
      notes,
      paid_installments_count: Math.min(paid, instCount),
      is_debt: isDebt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {initialData ? 'Editar Compra Parcelada / Dívida' : 'Cadastrar Compra Parcelada / Cartão'}
            </h2>
            <p className="text-xs text-slate-400">
              Registra o débito total sem duplicar o fluxo de caixa mensal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição do Item ou Dívida</label>
            <input
              type="text"
              required
              placeholder="Ex: iPhone 15, Geladeira Brastemp, Empréstimo Pessoal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor Total da Compra (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1200.00"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Número de Parcelas</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={totalInstallments}
                onChange={(e) => handleInstallmentsChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor da Parcela (R$) <span className="text-[10px] text-slate-400">(Ajustável)</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-blue-400 font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Parcelas Já Pagas</label>
              <input
                type="number"
                min="0"
                value={paidCount}
                onChange={(e) => setPaidCount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Cartão / Banco Utilizado</label>
              <input
                type="text"
                placeholder="Ex: Nubank, Visa XP, Inter"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data da 1ª Parcela</label>
              <input
                type="date"
                required
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_debt"
              checked={isDebt}
              onChange={(e) => setIsDebt(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
            />
            <label htmlFor="is_debt" className="text-xs text-slate-300">
              Classificar como <span className="font-semibold text-rose-400">Dívida / Empréstimo</span> (aparecerá destacado)
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observações</label>
            <input
              type="text"
              placeholder="Ex: garantia estendida, taxa de juros..."
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
                title="Excluir Registro"
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
              Salvar Parcelamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
