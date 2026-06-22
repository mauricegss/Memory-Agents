import { useState, useEffect, useRef, useCallback } from 'react';
import { MemoryGameEngine } from './MemoryGameEngine';
import { HeuristicAI } from './ai/HeuristicAI';
import { RandomAI } from './ai/RandomAI';

export function useMemoryGame(cardPairs, aiConfig) {
  const [engine, setEngine] = useState(() => cardPairs && cardPairs.length > 0 ? new MemoryGameEngine(cardPairs) : null);
  const [gameState, setGameState] = useState(() => engine ? engine.getState() : null);
  
  const [prevPairs, setPrevPairs] = useState(cardPairs);
  if (cardPairs !== prevPairs) {
    setPrevPairs(cardPairs);
    const newEngine = cardPairs && cardPairs.length > 0 ? new MemoryGameEngine(cardPairs) : null;
    setEngine(newEngine);
    setGameState(newEngine ? newEngine.getState() : null);
  }

  const aiRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (aiConfig?.ai_type === 'random') {
      aiRef.current = new RandomAI();
    } else {
      aiRef.current = new HeuristicAI({
        memoryDecayRate: aiConfig?.memory_decay_rate ?? 0.15,
        mistakeRate: aiConfig?.mistake_rate ?? 0.20
      });
    }
    return () => clearTimeout(timeoutRef.current);
  }, [aiConfig]);

  const updateState = useCallback(() => {
    if (engine) setGameState(engine.getState());
  }, [engine]);

  const processMatch = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      const result = engine.checkMatch();
      engine.clearFlipped();
      
      if (!result.isMatch) {
        engine.switchTurn();
      }
      
      updateState();
    }, 1000); // 1 segundo para observar o match ou erro
  }, [engine, updateState]);

  const handleFlip = useCallback((index) => {
    if (!engine || engine.turn !== 'player') return;
    
    if (engine.flipCard(index)) {
      updateState();
      aiRef.current?.onCardRevealed(index, engine.cards[index]);

      if (engine.flippedIndices.length === 2) {
        processMatch();
      }
    }
  }, [engine, updateState, processMatch]);

  // Hook isolado para lidar com o turno da IA sempre que o gameState mudar
  useEffect(() => {
    if (!gameState || gameState.gameOver || gameState.turn !== 'ai') return;
    if (engine.flippedIndices.length === 2) return; // Já está aguardando processMatch

    let isCancelled = false;

    const playAITurn = async () => {
      const delay = ms => new Promise(r => setTimeout(r, ms));
      const thinkingDelay = aiConfig?.thinking_delay_ms || 1500;
      
      await delay(thinkingDelay / 2);
      if (isCancelled) return;

      const idx = await aiRef.current?.chooseNextCard(gameState);
      if (idx === null || isCancelled) return;

      engine.flipCard(idx);
      updateState();
      aiRef.current?.onCardRevealed(idx, engine.cards[idx]);

      if (engine.flippedIndices.length === 2) {
        processMatch();
      }
    };

    playAITurn();

    return () => {
      isCancelled = true;
    };
  }, [gameState, engine, aiConfig, processMatch, updateState]);

  const restart = useCallback(() => {
    if (cardPairs && cardPairs.length > 0) {
      const newEngine = new MemoryGameEngine(cardPairs);
      setEngine(newEngine);
      setGameState(newEngine.getState());
    }
  }, [cardPairs]);

  return {
    gameState,
    handleFlip,
    restart,
    isLoaded: !!gameState
  };
}
