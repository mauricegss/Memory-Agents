import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Clock, Loader2, RefreshCw, Trophy, User } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMemoryGame } from '../../game-engines/memory/useMemoryGame';

const FALLBACK_VALUES = ['Sol', 'Lua', 'Rio', 'Mar', 'Casa', 'Flor', 'Livro', 'Mapa', 'Arte', 'Nota', 'Azul', 'Verde'];

const generateFallbackDeck = (pairCount = 8) => {
  const pairsToUse = Math.min(Math.max(Number(pairCount) || 8, 2), FALLBACK_VALUES.length);
  return FALLBACK_VALUES.slice(0, pairsToUse).map((value) => ({
    item1_type: 'text', item1_content: value,
    item2_type: 'text', item2_content: value,
  }));
};

const formatClock = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

const GameArena = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turma');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [gameConfig, setGameConfig] = useState(null);
  const [cardsConfig, setCardsConfig] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saveError, setSaveError] = useState(null);
  const startedAtRef = useRef(null);
  const reportSavedRef = useRef(false);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        setSaveError(null);

        const { data: gameData, error: gameError } = await supabase
          .from('memory_agents_games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;
        setGameConfig(gameData);

        const { data: cardsData, error: cardsError } = await supabase
          .from('memory_agents_cards')
          .select('*')
          .eq('game_id', gameId)
          .order('pair_index', { ascending: true });

        if (cardsError) throw cardsError;

        if (cardsData && cardsData.length > 0) {
          setCardsConfig(cardsData);
        } else {
          setCardsConfig(generateFallbackDeck((gameData.card_count || 16) / 2));
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        setCardsConfig(generateFallbackDeck(8));
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  const aiConfig = useMemo(() => ({
    ai_type: 'heuristic',
    difficulty: gameConfig?.difficulty || 'medium',
    memory_decay_rate: gameConfig?.difficulty === 'hard' ? 0.05 : gameConfig?.difficulty === 'easy' ? 0.3 : 0.15,
    mistake_rate: gameConfig?.difficulty === 'hard' ? 0.05 : gameConfig?.difficulty === 'easy' ? 0.3 : 0.15,
  }), [gameConfig?.difficulty]);

  const {
    gameState,
    handleFlip,
    restart
  } = useMemoryGame(cardsConfig, aiConfig);

  // Somando tentativas de ambos os lados para iniciar o relógio
  const totalFlips = gameState ? (gameState.cards.filter(c => c.isFlipped || c.isMatched).length) : 0;
  const isStarted = totalFlips > 0;

  useEffect(() => {
    if (!isStarted || gameState?.gameOver) return undefined;

    if (!startedAtRef.current) {
      startedAtRef.current = Date.now() - elapsedTime * 1000;
    }

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [elapsedTime, gameState?.gameOver, isStarted]);

  const submitReport = useCallback(async () => {
    if (!gameState?.gameOver || !user || !gameId || reportSavedRef.current) return;

    reportSavedRef.current = true;
    try {
      const { error } = await supabase.from('memory_agents_matches').insert([{
        game_id: gameId,
        turma_id: turmaId || null,
        player_id: user.id,
        player_score: gameState.score.player,
        ai_score: gameState.score.ai,
        player_flips: Math.floor(totalFlips / 2), // Estimativa simples
        ai_flips: Math.floor(totalFlips / 2),
        total_time_seconds: elapsedTime,
        ai_difficulty: gameConfig?.difficulty || 'medium',
        winner: gameState.score.player > gameState.score.ai
          ? 'player'
          : gameState.score.ai > gameState.score.player ? 'ai' : 'draw',
        completed: true,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar a partida:', error);
      setSaveError('Nao foi possivel salvar o resultado desta partida.');
      reportSavedRef.current = false;
    }
  }, [elapsedTime, gameConfig?.difficulty, gameId, gameState, turmaId, user, totalFlips]);

  useEffect(() => {
    submitReport();
  }, [submitReport]);

  const onRestartClick = () => {
    reportSavedRef.current = false;
    startedAtRef.current = null;
    setElapsedTime(0);
    setSaveError(null);
    if (restart) restart();
  };

  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  const { cards, turn, score, gameOver } = gameState;
  const gridColsClass = cards.length <= 12 ? 'grid-cols-4' : cards.length <= 20 ? 'grid-cols-5' : 'grid-cols-6';
  const aiDifficulty = gameConfig?.difficulty || 'medium';

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 text-center">
          <div className="flex justify-center items-center gap-2 text-indigo-400 mb-2">
            <Clock size={24} />
            <span className="text-3xl font-black">{formatClock(elapsedTime)}</span>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tempo decorrido</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800">
          <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-4">Placar do duelo</h3>
          <div className="space-y-4">
            <div className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${turn === 'player' ? 'bg-indigo-900/50 border-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div>
                <div className="flex items-center gap-2 text-indigo-300 font-bold"><User size={18} /> Voce</div>
              </div>
              <span className="text-2xl font-black text-indigo-400">{score.player}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${turn === 'ai' ? 'bg-purple-900/50 border-purple-500/50 ring-2 ring-purple-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Brain size={18} /> IA ({aiDifficulty})</div>
              </div>
              <span className="text-2xl font-black text-purple-400">{score.ai}</span>
            </div>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-950/40 border border-red-900 text-red-200 text-sm rounded-2xl p-4">
            {saveError}
          </div>
        )}

        <button
          onClick={onRestartClick}
          className="w-full flex items-center justify-center gap-2 p-4 border border-slate-700 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-md"
        >
          <RefreshCw size={18} /> Reiniciar partida
        </button>
      </div>

      <div className="lg:col-span-3 bg-slate-900 p-4 sm:p-8 rounded-[2rem] shadow-2xl min-h-[500px] flex items-center justify-center relative overflow-hidden border border-slate-800">
        {gameOver ? (
          <div className="text-center bg-slate-950/90 p-8 sm:p-10 rounded-3xl backdrop-blur-md border border-slate-800 z-30 shadow-2xl shadow-black/50">
            <Trophy size={64} className="mx-auto text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              {score.player > score.ai ? 'Voce venceu!' : score.ai > score.player ? 'A IA venceu!' : 'Empate!'}
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Placar final: Voce {score.player} x {score.ai} IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(turmaId ? `/turmas/${turmaId}` : '/')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-full transition-all border border-slate-700"
              >
                Voltar
              </button>
              <button
                onClick={onRestartClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
              >
                Jogar novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid ${gridColsClass} gap-3 sm:gap-4 w-full max-w-3xl z-10`}>
              {cards.map((card, index) => {
                const flipActive = card.isFlipped || card.isMatched;
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => handleFlip(index)}
                    className={`aspect-square cursor-pointer transform-gpu text-left ${turn === 'ai' || flipActive ? 'pointer-events-none' : ''}`}
                    style={{ perspective: '1000px' }}
                    aria-label="Carta do jogo da memoria"
                  >
                    <div className={`w-full h-full relative transition-transform duration-500 transform-gpu preserve-3d ${flipActive ? '[transform:rotateY(180deg)]' : ''}`}>
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-slate-700" />
                      </div>

                      <div className={`absolute inset-0 w-full h-full backface-hidden [transform:rotateY(180deg)] bg-slate-100 border-2 ${card.isMatched ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] opacity-70 scale-95' : 'border-indigo-400 shadow-xl'} rounded-2xl overflow-hidden flex items-center justify-center p-2`}>
                        {card.type === 'image' && card.content ? (
                          <img src={card.content} alt="Carta" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-lg sm:text-2xl md:text-3xl font-black text-slate-800 text-center break-words leading-tight">
                            {card.content || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {turn === 'ai' && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white px-6 py-2 rounded-full border border-purple-500/30 flex items-center gap-3 backdrop-blur-sm z-20 shadow-lg shadow-black/20">
                <Brain size={20} className="text-purple-400 animate-pulse" />
                <span className="font-bold text-sm tracking-wide">IA ({aiDifficulty}) analisando...</span>
              </div>
            )}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      ` }} />
    </div>
  );
};

export default GameArena;
