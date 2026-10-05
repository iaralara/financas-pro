import React, { useState } from 'react';
import { Mic, MicOff, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { TransactionType, PaymentMethod } from '../types';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    payment_method: PaymentMethod;
    date: string;
    notes?: string;
  }) => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interpretedData, setInterpretedData] = useState<{
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    payment_method: PaymentMethod;
    date: string;
  } | null>(null);

  if (!isOpen) return null;

  // Parser inteligente em português para voz
  const parsePortugueseFinancialAudio = (text: string) => {
    const lower = text.toLowerCase();
    
    // Extrair valor
    let amount = 0;
    const valueMatch = lower.match(/(?:r\$\s*|reais\s*|valor\s*de\s*)?(\d+([.,]\d{1,2})?)/);
    if (valueMatch) {
      amount = parseFloat(valueMatch[1].replace(',', '.'));
    }

    // Identificar tipo
    let type: TransactionType = 'expense';
    if (lower.includes('recebi') || lower.includes('ganhei') || lower.includes('salário') || lower.includes('venda') || lower.includes('receita')) {
      type = 'income';
    } else if (lower.includes('investi') || lower.includes('aporte') || lower.includes('poupança') || lower.includes('tesouro')) {
      type = 'investment';
    }

    // Identificar forma de pagamento
    let payment_method: PaymentMethod = 'PIX';
    if (lower.includes('cartão') || lower.includes('crédito')) payment_method = 'Cartão de crédito';
    else if (lower.includes('débito')) payment_method = 'Débito';
    else if (lower.includes('dinheiro') || lower.includes('espécie')) payment_method = 'Dinheiro';
    else if (lower.includes('boleto')) payment_method = 'Boleto';

    // Categoria e descrição
    let category = 'Outros';
    let description = 'Lançamento por Voz';

    if (lower.includes('supermercado') || lower.includes('mercado') || lower.includes('compras de comida')) {
      category = 'Mercado';
      description = 'Supermercado';
    } else if (lower.includes('restaurante') || lower.includes('almoço') || lower.includes('jantar') || lower.includes('lanche') || lower.includes('ifood')) {
      category = 'Alimentação';
      description = 'Alimentação / Refeição';
    } else if (lower.includes('combustível') || lower.includes('gasolina') || lower.includes('uber') || lower.includes('ônibus')) {
      category = 'Transporte';
      description = 'Transporte';
    } else if (lower.includes('farmácia') || lower.includes('remédio') || lower.includes('médico') || lower.includes('consulta')) {
      category = 'Saúde';
      description = 'Saúde / Farmácia';
    } else if (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('luz') || lower.includes('água') || lower.includes('internet')) {
      category = 'Moradia';
      description = 'Contas da Casa';
    } else {
      category = type === 'income' ? 'Renda Extra' : 'Despesas Diversas';
      description = text.slice(0, 30) || 'Lançamento por Voz';
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      description,
      amount: amount || 50,
      type,
      category,
      payment_method,
      date: today,
    };
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Simulação rápida para navegadores sem Web Speech API
      setIsRecording(true);
      setTimeout(() => {
        const demoPhrase = 'Comprei 80 reais de supermercado hoje no PIX';
        setTranscript(demoPhrase);
        setInterpretedData(parsePortugueseFinancialAudio(demoPhrase));
        setIsRecording(false);
      }, 2000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        setInterpretedData(parsePortugueseFinancialAudio(spokenText));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleApply = () => {
    if (!interpretedData) return;
    onConfirm(interpretedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold p-1"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
            isRecording ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
          }`}>
            {isRecording ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </div>
          <h2 className="text-lg font-bold text-white">Lançamento Rápido por Voz</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fale naturalmente, por exemplo: "Comprei 80 reais de supermercado hoje no PIX"
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={startVoiceRecording}
            disabled={isRecording}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            {isRecording ? 'Escutando você...' : 'Toque para Falar Agora'}
          </button>

          {transcript && (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Texto Ouvido:
              </span>
              <p className="text-sm text-slate-200 italic">"{transcript}"</p>
            </div>
          )}

          {interpretedData && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Interpretação do Consultor:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                <div>
                  <span className="text-slate-500 block">Tipo:</span>
                  <span className="font-semibold text-white capitalize">{interpretedData.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Valor:</span>
                  <span className="font-semibold text-emerald-400">R$ {interpretedData.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Categoria:</span>
                  <span className="font-semibold text-white">{interpretedData.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pagamento:</span>
                  <span className="font-semibold text-white">{interpretedData.payment_method}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="button"
              disabled={!interpretedData}
              onClick={handleApply}
              className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              Confirmar & Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
