import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2, Check, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const [role,         setRole]         = useState('aluno');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [name,         setName]         = useState('');
  const [error,        setError]        = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSuccess) navigate('/');
  }, [user, isSuccess, navigate]);

  // Força de senha
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-rose-500 text-rose-600' };
    if (score === 2 || score === 3) return { score: 2, label: 'Média', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, label: 'Forte', color: 'bg-emerald-500 text-emerald-600' };
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (authError) throw authError;
      if (authData.user) {
        setIsSuccess(true);
        showSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center flex-1 py-4">
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 text-center max-w-sm w-full animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Conta Criada! 🎉</h2>
          <p className="text-slate-500 mb-6 text-sm font-medium">
            Seu cadastro foi realizado com sucesso. Você será redirecionado em instantes!
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary py-3"
          >
            Ir para Login Agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 py-2 overflow-y-auto scrollbar-thin">
      <div className="w-full max-w-md my-auto">
        {/* Logo & Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 shadow-md shadow-blue-200 text-white">
            🧠
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Criar Conta Grátis</h1>
          <p className="text-slate-500 font-medium text-xs mt-0.5">Junte-se ao MemoryAgents e jogue com IA</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/60 border border-blue-100 p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Seleção de papel com preenchimento claro */}
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                Você é:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('aluno')}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    role === 'aluno'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={20} className={role === 'aluno' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className="font-black text-sm">Aluno</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    role === 'professor'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap size={20} className={role === 'professor' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className="font-black text-sm">Professor</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 ml-1">
                Nome completo
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-blue-500 pointer-events-none" size={18} />
                <input
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field input-with-icon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 ml-1">
                E-mail
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-blue-500 pointer-events-none" size={18} />
                <input
                  type="email"
                  placeholder="seu.email@escola.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-icon"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Senha
                </label>
                {password && (
                  <span className={`text-[11px] font-bold ${passwordStrength.color.split(' ')[1]}`}>
                    Força: {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-blue-500 pointer-events-none" size={18} />
                <input
                  type="password"
                  placeholder="Crie uma senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon"
                  required
                  minLength={6}
                />
              </div>
              {password && (
                <div className="flex gap-1.5 mt-1.5 px-1">
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 text-sm flex justify-center items-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={18} /> Criando conta...</>
              ) : (
                '✨ Criar Minha Conta'
              )}
            </button>
          </form>

          <div className="mt-4 text-center border-t border-blue-50 pt-3">
            <p className="text-slate-500 text-xs font-medium">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 font-black hover:text-blue-700 transition-colors underline-offset-2 hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
