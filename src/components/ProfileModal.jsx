import React, { useState } from 'react';
import { X, User, Mail, Lock, Check, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName]       = useState(user?.name || '');
  const [email, setEmail]     = useState(user?.email || '');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  const [loadingName,  setLoadingName]  = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPass,  setLoadingPass]  = useState(false);

  const [successName,  setSuccessName]  = useState(false);
  const [successEmail, setSuccessEmail] = useState(false);
  const [successPass,  setSuccessPass]  = useState(false);

  const [errorName,  setErrorName]  = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPass,  setErrorPass]  = useState('');

  /* ─── Salvar Nome ─── */
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) return;
    setLoadingName(true); setErrorName(''); setSuccessName(false);
    try {
      await updateProfile({ name: name.trim() });
      setSuccessName(true);
      setTimeout(() => setSuccessName(false), 3000);
    } catch (err) {
      setErrorName(err.message || 'Erro ao salvar nome.');
    } finally {
      setLoadingName(false);
    }
  };

  /* ─── Salvar Email ─── */
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || email.trim() === user?.email) return;
    setLoadingEmail(true); setErrorEmail(''); setSuccessEmail(false);
    try {
      await updateProfile({ email: email.trim() });
      setSuccessEmail(true);
      setTimeout(() => setSuccessEmail(false), 3000);
    } catch (err) {
      setErrorEmail(err.message || 'Erro ao salvar email.');
    } finally {
      setLoadingEmail(false);
    }
  };

  /* ─── Salvar Senha ─── */
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (password.length < 6) { setErrorPass('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (password !== confirmPassword) { setErrorPass('As senhas não coincidem.'); return; }
    setLoadingPass(true); setErrorPass(''); setSuccessPass(false);
    try {
      await updateProfile({ password });
      setSuccessPass(true);
      setPassword(''); setConfirmPassword('');
      setTimeout(() => setSuccessPass(false), 3000);
    } catch (err) {
      setErrorPass(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoadingPass(false);
    }
  };

  const roleBadge = user?.role === 'professor'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-blue-100 text-blue-700 border-blue-200';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay bg-blue-900/20">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-blue-100 overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight">{user?.name || 'Usuário'}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${roleBadge} bg-white/90`}>
                {user?.role === 'professor' ? '👨‍🏫 Professor' : '🎓 Aluno'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ─── Nome ─── */}
          <form onSubmit={handleSaveName} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-wide">
              <User size={15} className="text-blue-500" /> Nome de Exibição
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field flex-1"
                placeholder="Seu nome"
              />
              <button
                type="submit"
                disabled={loadingName || !name.trim() || name.trim() === user?.name}
                className="btn-primary px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loadingName ? <Loader2 size={16} className="animate-spin" /> : successName ? <Check size={16} /> : 'Salvar'}
              </button>
            </div>
            {errorName  && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/>{errorName}</p>}
            {successName && <p className="text-emerald-600 text-xs flex items-center gap-1"><Check size={12}/>Nome atualizado!</p>}
          </form>

          <div className="border-t border-blue-50" />

          {/* ─── Email ─── */}
          <form onSubmit={handleSaveEmail} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-wide">
              <Mail size={15} className="text-blue-500" /> Endereço de Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="seu@email.com"
              />
              <button
                type="submit"
                disabled={loadingEmail || !email.trim() || email.trim() === user?.email}
                className="btn-primary px-4 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loadingEmail ? <Loader2 size={16} className="animate-spin" /> : successEmail ? <Check size={16} /> : 'Salvar'}
              </button>
            </div>
            {errorEmail  && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/>{errorEmail}</p>}
            {successEmail && <p className="text-emerald-600 text-xs flex items-center gap-1"><Check size={12}/>Email atualizado! Verifique sua caixa de entrada.</p>}
          </form>

          <div className="border-t border-blue-50" />

          {/* ─── Senha ─── */}
          <form onSubmit={handleSavePassword} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-600 uppercase tracking-wide">
              <Lock size={15} className="text-blue-500" /> Alterar Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Nova senha (mín. 6 caracteres)"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Confirmar nova senha"
            />
            <button
              type="submit"
              disabled={loadingPass || !password}
              className="w-full btn-primary py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPass ? <Loader2 size={16} className="animate-spin" /> : successPass ? <Check size={16} /> : <Lock size={16} />}
              {loadingPass ? 'Alterando...' : successPass ? 'Senha alterada!' : 'Alterar Senha'}
            </button>
            {errorPass  && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/>{errorPass}</p>}
          </form>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
