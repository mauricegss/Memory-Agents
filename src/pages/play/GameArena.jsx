import React, { useState } from 'react';
import { Brain, User, RefreshCw, Trophy } from 'lucide-react';

const GameArena = () => {
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [isAiTurn, setIsAiTurn] = useState(false);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Painel Lateral: Placar e Status */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Placar do Duelo</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-bold"><User size={18}/> Você</div>
              <span className="text-2xl font-black text-blue-700">{score.player}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${isAiTurn ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-2 text-purple-700 font-bold"><Brain size={18}/> IA (MLP)</div>
              <span className="text-2xl font-black text-purple-700">{score.ai}</span>
            </div>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
          <RefreshCw size={18} /> Reiniciar Partida
        </button>
      </div>

      {/* Tabuleiro Central */}
      <div className="lg:col-span-3 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl min-h-[500px] flex items-center justify-center relative overflow-hidden">
         {/* Grid do Tabuleiro (Aumenta conforme a config 4x4, 6x6)  */}
         <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-center group">
                <div className="w-4 h-4 bg-slate-700 rounded-full group-hover:bg-indigo-500 transition-colors"></div>
              </div>
            ))}
         </div>

         {/* Overlay de Turno da IA */}
         {isAiTurn && (
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Brain size={48} className="animate-pulse mb-4 text-purple-400" />
              <p className="font-bold text-xl">IA Analisando Jogada...</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default GameArena;