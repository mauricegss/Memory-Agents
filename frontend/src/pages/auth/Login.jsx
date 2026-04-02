import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('aluno');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // No futuro, validaremos no backend e salvaremos no Context
    role === 'professor' ? navigate('/professor') : navigate('/aluno');
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 shadow-black/20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100">Acesse sua conta</h2>
        <p className="text-slate-400">Escolha como deseja entrar na plataforma</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
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
            <Mail className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="email" placeholder="E-mail institucional" className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="password" placeholder="Sua senha" className="w-full pl-12 pr-4 py-3 bg-slate-950 text-slate-200 placeholder:text-slate-600 rounded-xl border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-indigo-500 hover:-translate-y-0.5 transition-all">
          Entrar na Plataforma
        </button>
      </form>
    </div>
  );
};

export default Login;