import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Loader2, RefreshCw, Trophy, User, Star, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMemoryGame } from '../../game-engines/memory/useMemoryGame';
import RobotAvatar from '../../components/RobotAvatar';

/* ─── Fallback ─── */
const FALLBACK_VALUES = ['Sol', 'Lua', 'Rio', 'Mar', 'Casa', 'Flor', 'Livro', 'Mapa', 'Arte', 'Nota', 'Azul', 'Verde'];

const generateFallbackDeck = (pairCount = 8) => {
  const pairsToUse = Math.min(Math.max(Number(pairCount) || 8, 4), FALLBACK_VALUES.length);
  return FALLBACK_VALUES.slice(0, pairsToUse).map((value) => ({
    item1_type: 'text', item1_content: value,
    item2_type: 'text', item2_content: value,
  }));
};

/* ─── Relógio formatado ─── */
const formatClock = (seconds) => {
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, '0')}`;
};

/* ─── Grid dinâmico baseado na quantidade de cartas ─── */
const getGridCols = (total) => {
  if (total <= 8)  return 4;
  if (total <= 12) return 4;
  if (total <= 16) return 4;
  if (total <= 20) return 5;
  if (total <= 24) return 6;
  if (total <= 30) return 6;
  if (total <= 40) return 8;
  return 10;
};

/* ─── Barra de progresso de pares ─── */
const PairProgressBar = ({ label, score, total, color, isActive }) => {
  const pct = total > 0 ? (score / total) * 100 : 0;
  return (
    <div className={`rounded-2xl border-2 p-3 transition-all ${isActive ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-blue-100 bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black text-slate-600 uppercase tracking-wide">{label}</span>
        <span className={`text-lg font-black ${color}`}>
          {score} <span className="text-sm font-bold text-slate-400">/ {total} pares</span>
        </span>
      </div>
      <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   GAME ARENA
   ═══════════════════════════════════════════════ */
const GameArena = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turma');
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ─── Estado de carregamento ─── */
  const [loading,      setLoading]      = useState(true);
  const [gameConfig,   setGameConfig]   = useState(null);
  const [cardsConfig,  setCardsConfig]  = useState([]);

  /* ─── Relógio ─── */
  const [elapsedTime, setElapsedTime]   = useState(0);
  const startedAtRef                    = useRef(null);

  /* ─── Fase de preview ─── */
  const PREVIEW_DURATION = 3; // segundos
  const [previewPhase,   setPreviewPhase]   = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(PREVIEW_DURATION);

  /* ─── Salvar partida ─── */
  const [saveError,      setSaveError]      = useState(null);
  const reportSavedRef                      = useRef(false);

  /* ─── Buscar dados do jogo ─── */
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

        const deck = (cardsData && cardsData.length > 0)
          ? cardsData
          : generateFallbackDeck((gameData.card_count || 16) / 2);

        setCardsConfig(deck);
      } catch (error) {
        console.error('Erro ao buscar jogo:', error);
        setCardsConfig(generateFallbackDeck(8));
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  /* ─── Config da IA ─── */
  const aiConfig = useMemo(() => ({
    ai_type: 'heuristic',
    difficulty: gameConfig?.difficulty || 'medium',
    memory_capacity:   gameConfig?.difficulty === 'hard' ? 12 : gameConfig?.difficulty === 'easy' ? 2 : 4,
    memory_decay_rate: gameConfig?.difficulty === 'hard' ? 0.03 : gameConfig?.difficulty === 'easy' ? 0.35 : 0.15,
    mistake_rate:      gameConfig?.difficulty === 'hard' ? 0.03 : gameConfig?.difficulty === 'easy' ? 0.30 : 0.12,
    thinking_delay_ms: 1200,
  }), [gameConfig?.difficulty]);

  // IMPORTANTE: Sempre passar cardsConfig (nunca um [] literal novo a cada render).
  // O [] literal causava loop infinito porque useMemoryGame compara referências.
  // A fase de preview é apenas visual — o engine fica pronto mas o usuário não interage.
  const { gameState, handleFlip, restart } = useMemoryGame(cardsConfig, aiConfig);

  /* ─── Preview phase: mostrar cartas por 3 segundos ─── */
  useEffect(() => {
    if (loading || cardsConfig.length === 0) return;

    // Inicia o preview
    setPreviewPhase(true);
    setPreviewCountdown(PREVIEW_DURATION);

    const interval = setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPreviewPhase(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, cardsConfig]);

  /* ─── Relógio ─── */
  const isStarted = gameState ? gameState.cards.some(c => c.isFlipped || c.isMatched) : false;
  useEffect(() => {
    if (!isStarted || gameState?.gameOver) return;
    if (!startedAtRef.current) startedAtRef.current = Date.now() - elapsedTime * 1000;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, gameState?.gameOver, elapsedTime]);

  /* ─── Salvar partida ─── */
  const submitReport = useCallback(async () => {
    if (!gameState?.gameOver || !user || !gameId || reportSavedRef.current) return;
    reportSavedRef.current = true;
    try {
      const { error } = await supabase.from('memory_agents_matches').insert([{
        game_id:      gameId,
        turma_id:     turmaId || null,
        player_id:    user.id,
        player_score: gameState.score.player,
        ai_score:     gameState.score.ai,
        player_flips: gameState.flips.player,
        ai_flips:     gameState.flips.ai,
        total_time_seconds: elapsedTime,
        ai_difficulty: gameConfig?.difficulty || 'medium',
        winner: gameState.score.player > gameState.score.ai
          ? 'player' : gameState.score.ai > gameState.score.player ? 'ai' : 'draw',
        completed: true,
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      setSaveError('Não foi possível salvar o resultado desta partida.');
      reportSavedRef.current = false;
    }
  }, [elapsedTime, gameConfig?.difficulty, gameId, gameState, turmaId, user]);

  useEffect(() => { submitReport(); }, [submitReport]);

  /* ─── Reiniciar ─── */
  const onRestartClick = () => {
    reportSavedRef.current = false;
    startedAtRef.current   = null;
    setElapsedTime(0);
    setSaveError(null);
    setPreviewPhase(true);
    setPreviewCountdown(PREVIEW_DURATION);

    // Reinicia o engine
    if (restart) restart();

    const interval = setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPreviewPhase(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ─── Loading screen ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-blue-400 font-black text-lg">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  /* ─── Preview Phase: usa as cartas REAIS do engine na mesma posição do jogo ─── */
  if (previewPhase && gameState) {
    const previewCards = gameState.cards;
    const pCols = getGridCols(previewCards.length);
    const pRows = Math.ceil(previewCards.length / pCols);

    return (
      <div className="flex-1 flex gap-4 page-transition overflow-hidden">

        {/* Sidebar esquerda (espelho do jogo) */}
        <aside className="hidden lg:flex flex-col gap-4 w-52 xl:w-60 flex-shrink-0">
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 text-center shadow-sm">
            <div className="flex justify-center items-center gap-2 text-blue-600 mb-1">
              <Clock size={20} />
              <span className="text-3xl font-black">0:00</span>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Tempo</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Memorize!</p>
            <div className="text-5xl font-black text-blue-600">{previewCountdown}</div>
            <p className="text-slate-500 text-xs mt-1 font-bold">segundos</p>
          </div>
        </aside>

        {/* Centro: tabuleiro real com cartas reveladas */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* HUD mobile */}
          <div className="flex lg:hidden items-center justify-center gap-3 flex-shrink-0">
            <div className="bg-blue-600 text-white rounded-2xl px-6 py-2 font-black text-lg">
              {previewCountdown}s — Memorize!
            </div>
          </div>

          {/* Banner de instrução */}
          <div className="flex-shrink-0 flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl border-2 bg-blue-600 border-blue-700 text-white">
            <span className="font-black text-sm">👀 Memorize as posições das cartas!</span>
            <span className="text-xs opacity-80">O jogo começa em {previewCountdown}s</span>
          </div>

          {/* Grade — mesma estrutura do jogo real */}
          <div className="flex-1 min-h-0 w-full">
            <div
              className="game-grid-auto w-full h-full"
              style={{
                '--grid-cols': pCols,
                gridTemplateRows: `repeat(${pRows}, 1fr)`,
              }}
            >
              {previewCards.map((card) => (
                <div
                  key={card.id}
                  className="min-h-0 min-w-0 preview-glow"
                  style={{ perspective: '800px' }}
                >
                  <div className="w-full h-full relative">
                    {/* Carta revelada (face frontal) */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-1.5 border-2 bg-white border-blue-400 shadow-md">
                      {card.type === 'image' && card.content ? (
                        <img src={card.content} alt="Carta" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs sm:text-sm md:text-base font-black text-slate-700 text-center break-words leading-tight">
                          {card.content || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar direita: Robô */}
        <aside className="hidden lg:flex flex-col items-center justify-center w-44 xl:w-52 flex-shrink-0">
          <RobotAvatar isThinking={false} isWalking={false} score={0} playerScore={0} size={130} />
        </aside>
      </div>
    );
  }

  /* ─── Sem estado de jogo ─── */
  if (!gameState) {
    return (
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const { cards, turn, score, gameOver } = gameState;
  const totalPairs = cards.length / 2;
  const gridCols   = getGridCols(cards.length);
  const gridRows   = Math.ceil(cards.length / gridCols);
  const aiDifficulty = gameConfig?.difficulty || 'medium';
  const diffLabel  = { easy: '😊 Fácil', medium: '🤔 Médio', hard: '😈 Difícil' }[aiDifficulty] || aiDifficulty;

  /* ─── Tela de Fim de Jogo ─── */
  if (gameOver) {
    const playerWon = score.player > score.ai;
    const isDraw    = score.player === score.ai;

    return (
      <div className="flex-1 flex items-center justify-center page-transition">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-8 sm:p-12 text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">
            {isDraw ? '🤝' : playerWon ? '🏆' : '🤖'}
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {isDraw ? 'Empate!' : playerWon ? 'Você venceu!' : 'O robô venceu!'}
          </h2>
          <p className="text-slate-500 font-bold mb-6">
            {playerWon
              ? 'Parabéns! Sua memória é incrível! 🌟'
              : isDraw
              ? 'Foi muito equilibrado! Tente de novo!'
              : 'O robô foi mais rápido dessa vez!'}
          </p>

          {/* Placar final */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
              <div className="text-2xl mb-1">🧑</div>
              <div className="text-3xl font-black text-blue-600">{score.player}</div>
              <div className="text-xs font-bold text-slate-500">
                {score.player === 1 ? 'par' : 'pares'}
              </div>
              <div className="text-xs text-slate-400">Você</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border-2 border-blue-100">
              <div className="text-2xl mb-1">🤖</div>
              <div className="text-3xl font-black text-slate-600">{score.ai}</div>
              <div className="text-xs font-bold text-slate-500">
                {score.ai === 1 ? 'par' : 'pares'}
              </div>
              <div className="text-xs text-slate-400">Robô IA</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(turmaId ? `/turmas/${turmaId}` : '/')}
              className="btn-secondary px-6 py-3 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Voltar
            </button>
            <button
              onClick={onRestartClick}
              className="btn-primary px-8 py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Jogar Novamente
            </button>
          </div>

          {saveError && (
            <p className="text-red-500 text-xs mt-4 font-bold">{saveError}</p>
          )}
        </div>
      </div>
    );
  }

  /* ─── Arena Principal ─── */
  return (
    <div className="flex-1 flex gap-4 page-transition overflow-hidden">

      {/* ── Sidebar esquerda: Info do jogador + Stats ── */}
      <aside className="hidden lg:flex flex-col gap-4 w-52 xl:w-60 flex-shrink-0">
        {/* Relógio */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 text-center shadow-sm">
          <div className="flex justify-center items-center gap-2 text-blue-600 mb-1">
            <Clock size={20} />
            <span className="text-3xl font-black">{formatClock(elapsedTime)}</span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Tempo</p>
        </div>

        {/* Progresso Jogador */}
        <PairProgressBar
          label="🧑 Você"
          score={score.player}
          total={totalPairs}
          color="text-blue-600"
          isActive={turn === 'player'}
        />

        {/* Progresso IA */}
        <PairProgressBar
          label="🤖 Robô IA"
          score={score.ai}
          total={totalPairs}
          color="text-slate-600"
          isActive={turn === 'ai'}
        />

        {/* Dificuldade */}
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-3 text-center shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dificuldade</p>
          <span className="font-black text-sm text-slate-700">{diffLabel}</span>
        </div>

        {/* Botão reiniciar */}
        <button
          onClick={onRestartClick}
          className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm mt-auto"
        >
          <RefreshCw size={16} /> Reiniciar
        </button>
      </aside>

      {/* ── Centro: Tabuleiro ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

        {/* HUD mobile (topo) */}
        <div className="flex lg:hidden items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-blue-200 px-3 py-2 shadow-sm">
            <Clock size={16} className="text-blue-500" />
            <span className="font-black text-blue-600">{formatClock(elapsedTime)}</span>
          </div>

          <div className="flex gap-2 text-sm font-black">
            <span className={`px-3 py-2 rounded-xl border-2 ${turn === 'player' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-blue-100 text-slate-400'}`}>
              🧑 {score.player}
            </span>
            <span className="text-slate-300 self-center">—</span>
            <span className={`px-3 py-2 rounded-xl border-2 ${turn === 'ai' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-blue-100 text-slate-400'}`}>
              🤖 {score.ai}
            </span>
          </div>

          <button onClick={onRestartClick} className="bg-white border border-blue-200 p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors shadow-sm">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Indicador de turno */}
        <div className={`flex-shrink-0 flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl border-2 transition-all ${
          turn === 'player'
            ? 'bg-blue-600 border-blue-700 text-white'
            : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          {turn === 'player' ? (
            <>
              <User size={18} />
              <span className="font-black text-sm">Sua vez!</span>
              <span className="text-xs opacity-80">Encontre um par</span>
            </>
          ) : (
            <>
              <span className="text-base">🤖</span>
              <span className="font-black text-sm">Vez do Robô IA</span>
              <span className="text-xs opacity-70 italic">pensando...</span>
            </>
          )}
        </div>

        {/* Grade de cartas */}
        <div className="flex-1 min-h-0 w-full">
          <div
            className="game-grid-auto w-full h-full"
            style={{
              '--grid-cols': gridCols,
              '--grid-rows': gridRows,
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            }}
          >
            {cards.map((card, index) => {
              const isVisible = card.isFlipped || card.isMatched;
              const canFlip   = turn === 'player' && !isVisible;

              return (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => canFlip && handleFlip(index)}
                  className={`min-h-0 min-w-0 cursor-pointer transform-gpu ${
                    canFlip ? 'hover:scale-105 active:scale-95' : 'cursor-default'
                  }`}
                  style={{ perspective: '800px' }}
                  aria-label="Carta do jogo da memória"
                >
                  <div
                    className={`w-full h-full relative transition-transform duration-400 transform-gpu preserve-3d ${
                      isVisible ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    {/* Verso (frente fechada) */}
                    <div className="absolute inset-0 backface-hidden memory-card-back rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-blue-700 shadow-md hover:border-blue-400 transition-colors">
                      <span className="text-white/40 text-2xl">★</span>
                    </div>

                    {/* Frente (revelada) */}
                    <div className={`
                      absolute inset-0 backface-hidden [transform:rotateY(180deg)]
                      rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-1.5 border-2
                      ${card.isMatched
                        ? 'bg-emerald-50 border-emerald-400 shadow-md shadow-emerald-200/50 opacity-80'
                        : 'bg-white border-blue-400 shadow-md'}
                      transition-all
                    `}>
                      {card.type === 'image' && card.content ? (
                        <img src={card.content} alt="Carta" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs sm:text-sm md:text-base font-black text-slate-700 text-center break-words leading-tight">
                          {card.content || '?'}
                        </span>
                      )}
                      {card.isMatched && (
                        <div className="absolute top-0.5 right-0.5">
                          <Star size={12} className="text-emerald-500 fill-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sidebar direita: Robô ── */}
      <aside className="hidden lg:flex flex-col items-center justify-center w-44 xl:w-52 flex-shrink-0">
        <RobotAvatar
          isThinking={turn === 'ai'}
          isWalking={turn === 'ai'}
          score={score.ai}
          playerScore={score.player}
          size={130}
        />

        {/* Placar da IA */}
        <div className="mt-4 bg-white rounded-2xl border-2 border-blue-100 p-3 text-center w-full shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pares do Robô</p>
          <p className="text-2xl font-black text-slate-700 mt-1">
            {score.ai}
            <span className="text-sm font-bold text-slate-400"> / {totalPairs}</span>
          </p>
        </div>

        {/* Placar do jogador */}
        <div className="mt-3 bg-blue-600 rounded-2xl p-3 text-center w-full shadow-md">
          <p className="text-xs font-black text-blue-200 uppercase tracking-widest">Seus Pares</p>
          <p className="text-2xl font-black text-white mt-1">
            {score.player}
            <span className="text-sm font-bold text-blue-300"> / {totalPairs}</span>
          </p>
        </div>

        {saveError && (
          <p className="text-red-500 text-xs mt-3 text-center font-bold">{saveError}</p>
        )}
      </aside>

      {/* CSS utilitários 3D */}
      <style dangerouslySetInnerHTML={{ __html: `
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .duration-400 { transition-duration: 400ms; }
      ` }} />
    </div>
  );
};

export default GameArena;
