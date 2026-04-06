import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, BarChart3 } from 'lucide-react';
import GameCard from '../../components/GameCard';
import { useAuth } from '../../context/AuthContext';

const TurmaView = () => {
  const { turmaId } = useParams();
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Header Estilo Moodle / Roblox Group */}
      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-md shadow-black/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-bold mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar ao Início
        </Link>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-900/50 border border-indigo-800 text-indigo-300 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">Turma {turmaId || "123"}</span>
              <span className="flex items-center gap-1 text-slate-400 text-sm font-medium"><Users size={16} /> 32 Alunos</span>
            </div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tight">Matemática do 6º Ano</h1>
            <p className="text-slate-400 mt-2 font-medium">Professora: <span className="font-bold text-slate-300">Helyane Borges</span></p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {user?.role === 'professor' && (
              <button 
                onClick={() => alert('Em breve você poderá ver os relatórios completos desta turma!')}
                className="bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all text-sm mb-2 shadow-sm"
              >
                <BarChart3 size={18} /> Ver Relatórios da Turma
              </button>
            )}
            <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
               <div className="bg-amber-900/40 p-3 rounded-xl text-amber-400">
                 <Trophy size={24} />
               </div>
               <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">{user?.role === 'professor' ? 'Média da Turma' : 'Sua Posição'}</p>
                 <p className="text-xl font-black text-slate-100">{user?.role === 'professor' ? '8.5' : '3º Lugar'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Atividades (Jogos) Associadas à Turma */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100">Atividades da Turma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <GameCard id="1" title="Tabuada Interativa" author="Prof. Helyane" likes={98} fallbackColor="bg-emerald-500" />
          <GameCard id="2" title="Desafio das Frações" author="Prof. Helyane" likes={92} fallbackColor="bg-amber-500" />
          <GameCard id="3" title="Geometria Espacial" author="Prof. Helyane" likes={88} fallbackColor="bg-blue-600" />
          <GameCard id="4" title="Equações do 1º Grau" author="Prof. Helyane" likes={95} fallbackColor="bg-rose-500" />
        </div>
      </div>
    </div>
  );
};

export default TurmaView;

