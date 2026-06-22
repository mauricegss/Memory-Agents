import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Lock, Mail, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [role, setRole] = useState('aluno');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSuccess) {
      navigate('/');
    }
  }, [user, isSuccess, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        setIsSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 size={64} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Conta Criada!</h2>
        <p className="text-slate-400 mb-6">
          Seu cadastro foi realizado com sucesso. Você será redirecionado para o login em instantes.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 shadow-black/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Crie sua conta</h2>
        <p className="text-slate-400">Junte-se à comunidade MemoryAgents</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('aluno')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'aluno' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            <BookOpen size={24} /> <span className="font-bold text-sm">Sou Aluno</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('professor')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'professor' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
          >
            <GraduationCap size={24} /> <span className="font-bold text-sm">Sou Professor</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Nome completo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              required 
            />
          </div>
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
              placeholder="Crie uma senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              required 
              minLength={6}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-indigo-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={20} /> Criando conta...</>
          ) : (
            'Criar Minha Conta'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Já tem uma conta? <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300">Faça login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
