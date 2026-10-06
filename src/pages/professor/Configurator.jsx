import React, { useState } from 'react';
import ConfigForm from '../../components/ConfigForm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Configurator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerateGame = async (configData) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: gameData, error: gameError } = await supabase.from('memory_agents_games').insert([
        {
          title: configData.title,
          author_id: user.id,
          match_type: configData.matchType,
          difficulty: configData.difficulty,
          card_count: configData.cardCount
        }
      ]).select().single();

      if (gameError) throw gameError;

      // Insert cards
      const cardsToInsert = configData.pairs.map((pair, index) => ({
        game_id: gameData.id,
        pair_index: index,
        item1_type: pair.item1.type,
        item1_content: pair.item1.content,
        item2_type: pair.item2.type,
        item2_content: pair.item2.content
      }));

      const { error: cardsError } = await supabase.from('memory_agents_cards').insert(cardsToInsert);
      if (cardsError) throw cardsError;

      // Determine AI parameters based on difficulty
      let capacity = 4, decay = 0.15, mistake = 0.12;
      if (configData.difficulty === 'easy') { capacity = 2; decay = 0.35; mistake = 0.30; }
      else if (configData.difficulty === 'hard') { capacity = 12; decay = 0.03; mistake = 0.03; }

      // Default AI Config
      const { error: aiError } = await supabase.from('memory_agents_ai_configs').insert([
        {
          game_id: gameData.id,
          ai_type: 'heuristic',
          memory_capacity: capacity,
          memory_decay_rate: decay,
          mistake_rate: mistake
        }
      ]);
      if (aiError) throw aiError;
      
      showSuccess(`Jogo "${configData.title}" criado com sucesso! 🎉`);
      navigate('/professor');
    } catch (error) {
      console.error(error);
      showError('Erro ao criar jogo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0">
      <div className="max-w-4xl mx-auto py-2 space-y-4">
        <button 
          onClick={() => navigate('/professor')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Voltar ao Painel
        </button>

        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={14} /> Criador de Desafios IA
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Criar Novo Jogo da Memória</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Personalize as cartas, regras de correspondência e o comportamento do robô adversário.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-2 sm:p-4 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center gap-3">
               <Loader2 className="animate-spin text-blue-600" size={48} />
               <p className="text-slate-800 font-black text-base">Salvando seu jogo e gerando cartas...</p>
            </div>
          )}
          <ConfigForm onSubmit={handleGenerateGame} />
        </div>
      </div>
    </div>
  );
};

export default Configurator;