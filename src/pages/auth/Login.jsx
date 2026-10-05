import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2, Sparkles, ShieldCheck, Users, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Login = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { showSuccess } = useToast();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      showSuccess('Bem-vindo de volta! 🚀');
      navigate('/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos. Tente novamente!'
        : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 py-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-blue-200 text-white">
            🧠
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Bem-vindo de volta!</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Entre na sua conta para acessar seus jogos e turmas</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-100/60 border border-blue-100 p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-sm font-bold animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
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
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-blue-500 pointer-events-none" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3.5 text-base flex justify-center items-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={20} /> Entrando...</>
              ) : (
                '🚀 Entrar na Plataforma'
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-blue-50 pt-4">
            <p className="text-slate-500 text-sm font-medium">
              Ainda não tem uma conta?{' '}
              <Link to="/auth/register" className="text-blue-600 font-black hover:text-blue-700 transition-colors underline-offset-2 hover:underline">
                Cadastre-se grátis!
              </Link>
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="bg-white/80 border border-blue-100/80 rounded-2xl p-2.5 shadow-xs">
            <Gamepad2 size={16} className="mx-auto text-blue-600 mb-1" />
            <p className="text-[11px] font-bold text-slate-600">Jogos com IA</p>
          </div>
          <div className="bg-white/80 border border-blue-100/80 rounded-2xl p-2.5 shadow-xs">
            <Users size={16} className="mx-auto text-indigo-600 mb-1" />
            <p className="text-[11px] font-bold text-slate-600">Para Turmas</p>
          </div>
          <div className="bg-white/80 border border-blue-100/80 rounded-2xl p-2.5 shadow-xs">
            <ShieldCheck size={16} className="mx-auto text-emerald-600 mb-1" />
            <p className="text-[11px] font-bold text-slate-600">100% Gratuito</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
