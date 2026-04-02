import React, { useState } from 'react';
import { Zap, Type, Image as ImageIcon, Hash, PlaySquare, BoxSelect, Copy, Columns, ImageMinus } from 'lucide-react';
import { MatchBuilder } from './config/MatchBuilder';

const ConfigForm = ({ onSubmit }) => {
  const [difficulty, setDifficulty] = useState('medium');
  const [gameType, setGameType] = useState('memory_game'); // Locked
  const [matchType, setMatchType] = useState('image_image_same'); // "image_image_same", "image_image_diff", "text_text", "image_text"
  const [pairs, setPairs] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pairs.length < 2) {
      alert('Crie pelo menos 2 pares para gerar um jogo.');
      return;
    }
    onSubmit({ gameType, matchType, difficulty, pairs, cardCount: pairs.length * 2 });
  };

  const handleMatchTypeChange = (newType) => {
    setMatchType(newType);
    
    const defaultType1 = newType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = newType.endsWith('text') || newType === 'text_text' ? 'text' : 'image';
    
    setPairs(prevPairs => prevPairs.map(p => ({
      ...p,
      item1: { type: defaultType1, content: '' },
      item2: { type: defaultType2, content: '' }
    })));
  };

  return (
    <form className="p-6 space-y-8" onSubmit={handleSubmit}>
      {/* Opções Gerais do Jogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-bold text-slate-200"><BoxSelect size={20} className="text-indigo-400" /> Tipo de Jogo</label>
          <select 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 outline-none appearance-none cursor-not-allowed" 
            value={gameType} 
            disabled
          >
            <option value="memory_game">Jogo da Memória</option>
          </select>
          <p className="text-xs text-slate-500">Apenas o Jogo da Memória está disponível no momento.</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 font-bold text-slate-200"><Zap size={20} className="text-amber-400" /> Nível de Dificuldade</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none" 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Fácil (Cartas ficam visíveis mais tempo)</option>
            <option value="medium">Médio (Padrão)</option>
            <option value="hard">Difícil (Cartas viram rápido)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 font-bold text-slate-200"><Type size={20} className="text-emerald-400" /> Regra das Cartas (Modo de Correspondência)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${matchType === 'image_image_same' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
            <input type="radio" name="matchType" value="image_image_same" checked={matchType === 'image_image_same'} onChange={() => handleMatchTypeChange('image_image_same')} className="hidden" />
            <Copy size={28} />
            <span className="font-bold text-sm">Imagem = Imagem</span>
            <span className="text-[10px] leading-tight">Mesma Imagem (Cópia Exata)</span>
          </label>
          
          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${matchType === 'image_image_diff' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
            <input type="radio" name="matchType" value="image_image_diff" checked={matchType === 'image_image_diff'} onChange={() => handleMatchTypeChange('image_image_diff')} className="hidden" />
            <Columns size={28} />
            <span className="font-bold text-sm">Imagem ≠ Imagem</span>
            <span className="text-[10px] leading-tight">Imagens Diferentes Combinam</span>
          </label>
          
          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${matchType === 'image_text' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
            <input type="radio" name="matchType" value="image_text" checked={matchType === 'image_text'} onChange={() => handleMatchTypeChange('image_text')} className="hidden" />
            <ImageMinus size={28} />
            <span className="font-bold text-sm">Imagem = Texto</span>
            <span className="text-[10px] leading-tight">Ligar Imagem ao seu Significado</span>
          </label>
          
          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${matchType === 'text_text' ? 'border-indigo-500 bg-indigo-900/30 text-indigo-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
            <input type="radio" name="matchType" value="text_text" checked={matchType === 'text_text'} onChange={() => handleMatchTypeChange('text_text')} className="hidden" />
            <Type size={28} />
            <span className="font-bold text-sm">Texto = Texto</span>
            <span className="text-[10px] leading-tight">Mapear Conceito e Definição</span>
          </label>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Componente Modular de Construção de Pares */}
      <MatchBuilder matchType={matchType} pairs={pairs} setPairs={setPairs} />

      <hr className="border-slate-800" />

      <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
        <PlaySquare size={24} />
        Finalizar e Gerar Jogo
      </button>
    </form>
  );
};

export default ConfigForm;
