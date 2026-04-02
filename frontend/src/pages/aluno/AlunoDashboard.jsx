import React, { useState } from 'react';
import { BookOpen, Trophy, Play, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AlunoDashboard = () => {
  const [classCode, setClassCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (classCode) {
      alert(`Tentando entrar na turma de código: ${classCode}`);
      navigate('/turmas/123'); // Fake navigation
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-black mb-1">Área do Aluno</h2>
          <p className="text-indigo-200">Insira o código da sua turma para ingressar em novas atividades.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto bg-white/10 p-2 rounded-2xl backdrop-blur-sm">
          <input 
            type="text" 
            placeholder="Ex: UTFPR-2026" 
            className="bg-white/80 border-none rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-300 flex-1 transition-all outline-none"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
          />
          <button 
            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm"
            onClick={handleJoin}
          >
            Entrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-100">
            <BookOpen size={20} className="text-indigo-500" /> Minhas Turmas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Turma Card */}
            <Link to="/turmas/123" className="block group">
              <div className="bg-slate-900 border text-center md:text-left border-slate-800 p-6 rounded-3xl hover:border-indigo-500 hover:shadow-lg transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-900/40 transition-colors"></div>
                <div className="relative z-10">
                  <div className="bg-indigo-900 text-indigo-300 w-max px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-3">Sistemas de Informação</div>
                  <h4 className="text-xl font-black text-slate-100">Programação Web</h4>
                  <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-400">
                      <Users size={16} /> 45 Colegas
                    </div>
                    <div className="bg-slate-800 p-2 rounded-xl text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex justify-center">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-100"><Trophy size={20} className="text-amber-500"/> Conquistas vs IA</h3>
          <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800/50">
            <span className="text-5xl font-black text-indigo-500">12</span>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter mt-2">Partidas Ganhas</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AlunoDashboard;