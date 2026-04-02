import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import GameShelf from '../components/GameShelf';
import { Users, Plus } from 'lucide-react';

const DashboardHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');

  const handleJoinClass = () => {
    if (classCode) {
      navigate('/turmas/123'); // Fake navigation to the turma
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      
      {/* Seção Minhas Turmas (Substitui o Banner antigo) */}
      <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-md shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-900 shadow-inner p-4 rounded-2xl text-indigo-400 hidden sm:block">
            <Users size={32} />
          </div>
          <div>
             <h2 className="text-2xl font-black text-slate-100">Minhas Turmas</h2>
             <p className="text-slate-400 text-sm">Entre com o código do seu professor para acessar atividades exclusivas.</p>
          </div>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input 
            type="text" 
            placeholder="Ex: MAT-2026" 
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 flex-1 outline-none transition-all placeholder:text-slate-600"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
          />
          <button 
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-md flex items-center gap-2 whitespace-nowrap hover:-translate-y-0.5"
            onClick={handleJoinClass}
          >
            <Plus size={18} /> Entrar
          </button>
        </div>
      </section>

      {/* Seção 2: Recomendações para você */}
      <GameShelf title="Recomendações para você">
        <GameCard id="5" title="Animais da Savana (Inglês)" author="Prof. Maurice" likes={99} fallbackColor="bg-amber-500" />
        <GameCard id="6" title="Elementos Químicos" author="Admin" likes={85} fallbackColor="bg-rose-500" />
        <GameCard id="7" title="Capitais da Europa" author="Comunidade" likes={92} fallbackColor="bg-cyan-600" />
        <GameCard id="8" title="Verbos Irregulares" author="Prof. Silva" likes={78} fallbackColor="bg-purple-500" />
        <GameCard id="9" title="Física: Leis de Newton" author="Admin" likes={96} fallbackColor="bg-slate-800" />
      </GameShelf>

      {/* Seção 3: Mais Acessados / Destaques */}
      <GameShelf title="Mais Acessados da Semana">
        <GameCard id="10" title="Bandeiras do Mundo" author="Admin" likes={98} fallbackColor="bg-red-500" />
        <GameCard id="11" title="Tabuada do 7 ao 9" author="Comunidade" likes={94} fallbackColor="bg-blue-600" />
        <GameCard id="12" title="Sistema Solar" author="Prof. Maurice" likes={97} fallbackColor="bg-indigo-950" />
        <GameCard id="13" title="Corpo Humano 3D" author="Admin" likes={99} fallbackColor="bg-teal-500" />
      </GameShelf>
      
      {/* Seção 4: Lançamentos / Adicionados Recentemente */}
      <GameShelf title="Adicionados Recentemente">
         <GameCard id="14" title="Arte Renascentista" author="Prof. Clara" likes={100} fallbackColor="bg-stone-600" />
         <GameCard id="15" title="Presidentes Ocultos" author="Comunidade" likes={80} fallbackColor="bg-zinc-800" />
         <GameCard id="16" title="Mitologia Grega vs Nórdica" author="Admin" likes={91} fallbackColor="bg-yellow-600" />
         <GameCard id="17" title="Conjugação Verbal" author="Prof. João" likes={85} fallbackColor="bg-sky-500" />
      </GameShelf>

    </div>
  );
};

export default DashboardHub;