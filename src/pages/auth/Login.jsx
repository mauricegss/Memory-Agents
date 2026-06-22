import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      
      // The profile is fetched automatically by AuthContext's onAuthStateChange
      // But we might need a small delay or use the returned data if we need it here
      // For now, let's just navigate. The PrivateRoute will handle the rest or we can use the result.
      navigate('/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 shadow-black/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Acesse sua conta</h2>
        <p className="text-slate-400">Entre na plataforma MemoryAgents</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input 
              type="email" 
              placeholder="E-mail institucional" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input 
              type="password" 
              placeholder="Sua senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-indigo-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={20} /> Entrando...</>
          ) : (
            'Entrar na Plataforma'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Ainda não tem uma conta? <Link to="/auth/register" className="text-indigo-400 font-bold hover:text-indigo-300">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
