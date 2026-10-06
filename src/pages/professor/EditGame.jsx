import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfigForm from '../../components/ConfigForm';

const EditGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user || !gameId) return;
    loadGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gameId]);

  const loadGame = async () => {
    try {
      setLoading(true);
      setLoadError('');

      const { data: game, error } = await supabase
        .from('memory_agents_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      if (game.author_id !== user.id) {
        setLoadError('Você não tem permissão para editar este jogo.');
        return;
      }

      const { data: cards, error: cardsError } = await supabase
        .from('memory_agents_cards')
        .select('*')
        .eq('game_id', gameId)
        .order('pair_index', { ascending: true });

      if (cardsError) throw cardsError;

      const pairs = (cards || []).map((c) => ({
        id: `pair-${c.pair_index}`,
        item1: { type: c.item1_type, content: c.item1_content || '' },
        item2: { type: c.item2_type, content: c.item2_content || '' }
      }));

      setInitialData({
        title: game.title,
        difficulty: game.difficulty,
        matchType: game.match_type,
        pairs,
        thumbnailUrl: game.thumbnail_url
      });
    } catch (err) {
      console.error('[EditGame] Erro:', err);
      setLoadError('Não foi possível carregar o jogo: ' + (err.message || 'erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configData) => {
    try {
      setSaving(true);

      const { error: gameError } = await supabase
        .from('memory_agents_games')
        .update({
          title: configData.title,
          match_type: configData.matchType,
          difficulty: configData.difficulty,
          card_count: configData.cardCount,
          thumbnail_url: configData.thumbnailUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);
      if (gameError) throw gameError;

      const { error: deleteError } = await supabase
        .from('memory_agents_cards')
        .delete()
        .eq('game_id', gameId);
      if (deleteError) throw deleteError;

      if (configData.pairs.length > 0) {
        const cardsToInsert = configData.pairs.map((pair, index) => ({
          game_id: gameId,
          pair_index: index,
          item1_type: pair.item1.type,
          item1_content: pair.item1.content,
          item2_type: pair.item2.type,
          item2_content: pair.item2.content
        }));
        const { error: insertError } = await supabase.from('memory_agents_cards').insert(cardsToInsert);
        if (insertError) throw insertError;
      }

      let capacity = 4, decay = 0.15, mistake = 0.12;
      if (configData.difficulty === 'easy') { capacity = 2; decay = 0.35; mistake = 0.30; }
      else if (configData.difficulty === 'hard') { capacity = 12; decay = 0.03; mistake = 0.03; }

      await supabase
        .from('memory_agents_ai_configs')
        .update({
          memory_capacity: capacity,
          memory_decay_rate: decay,
          mistake_rate: mistake
        })
        .eq('game_id', gameId);

      showSuccess(`Jogo "${configData.title}" atualizado com sucesso!`);
      navigate('/professor');
    } catch (error) {
      console.error('[EditGame] Erro ao salvar:', error);
      showError('Erro ao salvar o jogo: ' + (error.message || 'erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="text-blue-500 font-black text-sm">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0">
      <div className="max-w-4xl mx-auto py-2 space-y-4">
        <button
          onClick={() => navigate('/professor')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Voltar ao Painel
        </button>

        {loadError ? (
          <div className="bg-white border border-red-100 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Não foi possível editar</h3>
            <p className="text-slate-400 text-xs mb-5">{loadError}</p>
            <button onClick={() => navigate('/professor')} className="btn-secondary py-2.5 px-5 text-xs font-black">
              Voltar ao Painel
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles size={14} /> Editor de Desafios
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Editar Jogo</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Altere o título, a capa, a dificuldade, o modo de correspondência e adicione novas cartas.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-2 sm:p-4 relative">
              {saving && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={48} />
                  <p className="text-slate-800 font-black text-base">Salvando alterações...</p>
                </div>
              )}
              <ConfigForm
                onSubmit={handleSave}
                initialData={initialData}
                submitLabel="Salvar Alterações"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditGame;
