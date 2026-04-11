import React, { useState } from 'react';
import ConfigForm from '../../components/ConfigForm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Configurator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGenerateGame = async (configData) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('games').insert([
        {
          title: configData.title,
          author_id: user.id,
          match_type: configData.matchType,
          difficulty: configData.difficulty,
          pairs: configData.pairs,
          card_count: configData.cardCount
        }
      ]);

      if (error) throw error;
      
      alert('Jogo criado com sucesso!');
      navigate('/professor');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar jogo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/professor')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Voltar ao Painel
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-100">Configurar Desafio de IA</h2>
        <p className="text-slate-400">Personalize o tabuleiro e o comportamento do adversário inteligente.</p>
      </div>

      <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-2 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center">
             <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
             <p className="text-white font-bold">Salvando seu jogo...</p>
          </div>
        )}
        <ConfigForm onSubmit={handleGenerateGame} />
      </div>
    </div>
  );
};

export default Configurator;