import assert from 'node:assert/strict';
import { HeuristicAI } from '../src/game-engines/memory/ai/HeuristicAI.js';
import { RandomAI } from '../src/game-engines/memory/ai/RandomAI.js';
import { MemoryGameEngine } from '../src/game-engines/memory/MemoryGameEngine.js';

const makePairs = (count) => Array.from({ length: count }, (_, index) => ({
  item1_type: 'text', item1_content: `A${index}`,
  item2_type: 'text', item2_content: `B${index}`,
}));

async function playGame(AI, pairCount = 6) {
  const engine = new MemoryGameEngine(makePairs(pairCount));
  engine.turn = 'ai';
  const ai = new AI();
  let safety = 0;
  while (!engine.isGameOver() && safety++ < 400) {
    const state = engine.getState();
    const index = await ai.chooseNextCard(state);
    assert.notEqual(index, null, 'A IA deve escolher uma carta disponível');
    assert.equal(engine.flipCard(index), true, 'A IA não pode escolher carta inválida');
    ai.onCardRevealed(index, engine.cards[index]);
    if (engine.flippedIndices.length === 2) {
      engine.checkMatch();
      engine.clearFlipped();
    }
  }
  assert.ok(engine.isGameOver(), 'A partida deve terminar');
  return engine.flips.ai;
}

// Capacidade e recência: a posição mais antiga sai primeiro.
const bounded = new HeuristicAI({ memoryCapacity: 2, memoryDecayRate: 0, mistakeRate: 0 });
bounded.onCardRevealed(0, { pairId: 0 });
bounded.onCardRevealed(1, { pairId: 1 });
bounded.onCardRevealed(2, { pairId: 2 });
assert.equal(bounded.memory.size, 2);
assert.equal(bounded.memory.has(0), false);

// Recuperação: com o par lembrado, a escolha deve ser determinística.
const recall = new HeuristicAI({ memoryCapacity: 4, memoryDecayRate: 0, mistakeRate: 0 });
recall.onCardRevealed(1, { pairId: 'sol' });
const target = await recall.chooseNextCard({ cards: [
  { isMatched: false, isFlipped: true, pairId: 'sol' },
  { isMatched: false, isFlipped: false, pairId: 'sol' },
  { isMatched: false, isFlipped: false, pairId: 'lua' },
] });
assert.equal(target, 1);

// Robustez: agentes conseguem encerrar uma partida sem jogadas inválidas.
const heuristicFlips = await playGame(class extends HeuristicAI {
  constructor() { super({ memoryCapacity: 12, memoryDecayRate: 0, mistakeRate: 0 }); }
});
const randomFlips = await playGame(RandomAI);
assert.ok(heuristicFlips > 0 && randomFlips > 0);

console.log(`IA validada: heurística terminou em ${heuristicFlips} viradas; aleatória em ${randomFlips} viradas.`);
