import React, { useState } from 'react';
import { useData } from '../context/FinanceContext';
import { InstallmentPurchase } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { InstallmentModal } from './InstallmentModal';

export const InstallmentsView: React.FC = () => {
  const { installments, addInstallment, updateInstallment, deleteInstallment } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InstallmentPurchase | null>(null);

  // Totais
  const totalPurchasesDebt = installments.reduce((acc, i) => acc + i.total_amount, 0);
  const totalPaid = installments.reduce(
    (acc, i) => acc + i.paid_installments_count * i.installment_amount,
    0
  );
  const totalRemaining = totalPurchasesDebt - totalPaid;

  const currentMonthCommitment = installments
    .filter((i) => i.paid_installments_count < i.total_installments)
    .reduce((acc, i) => acc + i.installment_amount, 0);

  // Calcular mês final de término de um parcelamento
  const getEndMonthYear = (firstDate: string, totalCount: number): string => {
    try {
      const [year, month] = firstDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1 + (totalCount - 1), 1);
      return targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleIncrementPaid = (item: InstallmentPurchase) => {
    if (item.paid_installments_count < item.total_installments) {
      updateInstallment(item.id, {
        paid_installments_count: item.paid_installments_count + 1,
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Cartões & Dívidas
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Compras Parceladas & Compromissos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contabilize as dívidas totais sem duplicar o fluxo mensal de caixa.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Compra Parcelada
        </button>
      </div>

      {/* Resumo Consolidado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Impacto Mensal Atual</span>
          <p className="text-lg font-bold text-amber-400">{formatCurrency(currentMonthCommitment)}</p>
          <span className="text-[10px] text-slate-500">Soma das parcelas ativas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Saldo Devedor Total</span>
          <p className="text-lg font-bold text-rose-400">{formatCurrency(totalRemaining)}</p>
          <span className="text-[10px] text-slate-500">Restante para quitar</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Já Pago</span>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
          <span className="text-[10px] text-slate-500">Amortizado até hoje</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">Total Original Contratado</span>
          <p className="text-lg font-bold text-white">{formatCurrency(totalPurchasesDebt)}</p>
          <span className="text-[10px] text-slate-500">Soma dos valores integrais</span>
        </div>
      </div>

      {/* Lista de Parcelamentos */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Seus Parcelamentos Cadastrados ({installments.length})
        </h2>

        {installments.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs">
            Nenhuma compra parcelada registrada. Cadastre seus cartões ou empréstimos acima.
          </div>
        ) : (
          installments.map((inst) => {
            const paidCount = inst.paid_installments_count;
            const remainingCount = Math.max(0, inst.total_installments - paidCount);
            const remainingValue = remainingCount * inst.installment_amount;
            const paidValue = paidCount * inst.installment_amount;
            const progressPct = Math.round((paidCount / inst.total_installments) * 100);
            const isFinished = paidCount >= inst.total_installments;
            const nextInstNumber = Math.min(paidCount + 1, inst.total_installments);
            const endMonth = getEndMonthYear(inst.first_installment_date, inst.total_installments);

            return (
              <div
                key={inst.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        inst.is_debt
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{inst.description}</h3>
                        {inst.is_debt && (
                          <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded-md">
                            DÍVIDA
                          </span>
                        )}
                        {isFinished && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> QUITADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {inst.card_name ? `${inst.card_name} • ` : ''}
                        Categoria: {inst.category} • Vence todo dia {inst.due_day}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingItem(inst);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg text-xs"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteInstallment(inst.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg text-xs"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Exibição Solicitada: Parcela 3/12 — R$ 150 — vence dia 10 */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div>
                    <span className="font-bold text-blue-400">
                      {isFinished
                        ? `Todas as ${inst.total_installments} parcelas pagas!`
                        : `Parcela ${nextInstNumber}/${inst.total_installments} — ${formatCurrency(
                            inst.installment_amount
                          )} — Vence dia ${inst.due_day}`}
                    </span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Término previsto: {endMonth}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Restante a pagar:</span>
                      <span className="font-bold text-rose-400">{formatCurrency(remainingValue)}</span>
                    </div>

                    {!isFinished && (
                      <button
                        onClick={() => handleIncrementPaid(inst)}
                        className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pagar Parcela
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>
                      Progresso: {paidCount} de {inst.total_installments} pagas ({formatCurrency(paidValue)})
                    </span>
                    <span className="font-semibold text-slate-300">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <InstallmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          if (editingItem) {
            updateInstallment(editingItem.id, data);
          } else {
            addInstallment(data);
          }
        }}
        onDelete={(id) => deleteInstallment(id)}
        initialData={editingItem}
      />
    </div>
  );
};
