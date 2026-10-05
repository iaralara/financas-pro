import React, { useState } from 'react';
import { useAuth } from '../context/FinanceContext';
import { ShieldCheck, Mail, Lock, User, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, loginWithPassword, signUpWithPassword, logout, isMockMode } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setStatusMsg(null);

    if (isRegisterMode) {
      const res = await signUpWithPassword(email, password, name);
      setLoading(false);
      if (res?.error) {
        setStatusMsg({ text: res.error, isError: true });
      } else {
        setStatusMsg({ text: res.message || 'Conta criada com sucesso!', isError: false });
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } else {
      const res = await loginWithPassword(email, password);
      setLoading(false);
      if (res?.error) {
        setStatusMsg({ text: res.error, isError: true });
      } else {
        setStatusMsg({ text: 'Login efetuado com sucesso!', isError: false });
        setTimeout(() => {
          onClose();
        }, 800);
      }
    }
  };

  const mobileUrl = 'http://192.168.0.7:5173';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold p-2"
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {user ? 'Sua Conta Protegida' : isRegisterMode ? 'Criar Cadastro Pessoal' : 'Entrar no FinançasPro'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seus dados são 100% isolados por usuário via Row Level Security (RLS).
          </p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Conectado como
              </span>
              <p className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                {user.email}
              </p>
              <p className="text-xs text-slate-300 mt-1">Nome: {user.full_name || 'Usuário'}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">ID: {user.id}</p>
            </div>

            {/* QR Code para abrir no celular */}
            <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-center space-y-3">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {showQr ? 'Ocultar QR Code Celular' : '📱 Gerar QR Code para Abrir no Celular'}
              </button>

              {showQr && (
                <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mt-2">
                  <QRCodeSVG value={mobileUrl} size={180} />
                  <p className="text-[11px] text-slate-900 font-bold mt-2 font-mono">
                    {mobileUrl}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Aponte a câmera do celular para este link enquanto estiver no mesmo Wi-Fi para usar em tempo real!
              </p>
            </div>

            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 rotate-180" />
              Sair da Conta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Alternar Abas Login / Cadastro */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setStatusMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  !isRegisterMode ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setStatusMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  isRegisterMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 dígitos"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMsg.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                isRegisterMode
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Concluir Cadastro & Acessar
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar na Minha Conta
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
