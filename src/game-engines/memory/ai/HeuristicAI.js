import { AIStrategyBase } from './AIStrategyBase';

export class HeuristicAI extends AIStrategyBase {
  constructor(config = {}) {
    super();
    this.memory = new Map(); // position -> pairId
    this.memoryDecayRate = config.memoryDecayRate ?? 0.15;
    this.mistakeRate = config.mistakeRate ?? 0.20;
  }

  onCardRevealed(index, card) {
    this.memory.set(index, card.pairId);
    
    // Chance de esquecer outras cartas que estão na memória
    for (const key of this.memory.keys()) {
      if (key !== index && Math.random() < this.memoryDecayRate) {
        this.memory.delete(key);
      }
    }
  }

  async chooseNextCard(gameState) {
    const available = gameState.cards
      .map((c, i) => (!c.isMatched && !c.isFlipped ? i : -1))
      .filter(i => i !== -1);
      
    if (available.length === 0) return null;

    // Limpar da memória as cartas que já foram feitas par
    gameState.cards.forEach((c, i) => {
      if (c.isMatched) this.memory.delete(i);
    });

    const flippedIndices = gameState.cards
      .map((c, i) => (c.isFlipped && !c.isMatched ? i : -1))
      .filter(i => i !== -1);

    // 1. Vai cometer um erro intencional (simulando desatenção humana)?
    if (Math.random() < this.mistakeRate) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // 2. Já tem uma carta virada? Procura o par dela na memória
    if (flippedIndices.length === 1) {
      const firstCardIdx = flippedIndices[0];
      const targetPairId = gameState.cards[firstCardIdx].pairId;
      
      for (const [idx, pairId] of this.memory.entries()) {
        if (pairId === targetPairId && idx !== firstCardIdx && !gameState.cards[idx].isMatched) {
          return idx; // Achou o par!
        }
      }
      // Não lembrava do par, chuta.
      return available[Math.floor(Math.random() * available.length)];
    }

    // 3. Nenhuma carta virada? Procura dois pares que já conheça na memória
    let knownPair = null;
    const memoryArr = Array.from(this.memory.entries())
        .filter(([idx]) => !gameState.cards[idx].isMatched && !gameState.cards[idx].isFlipped);
        
    for (let i = 0; i < memoryArr.length; i++) {
      for (let j = i + 1; j < memoryArr.length; j++) {
        if (memoryArr[i][1] === memoryArr[j][1]) {
          knownPair = [memoryArr[i][0], memoryArr[j][0]];
          break;
        }
      }
      if (knownPair) break;
    }

    if (knownPair) {
      return knownPair[0]; // Retorna a primeira do par conhecido, a próxima rodada ele acha a segunda
    }

    // 4. Se não sabe nenhum par de cor, chuta uma carta aleatória (para aprender e expandir a memória)
    return available[Math.floor(Math.random() * available.length)];
  }
}
