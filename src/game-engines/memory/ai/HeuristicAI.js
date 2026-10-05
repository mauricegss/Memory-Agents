import { AIStrategyBase } from './AIStrategyBase.js';

export class HeuristicAI extends AIStrategyBase {
  constructor(config = {}) {
    super();
    this.memory = new Map(); // position -> pairId
    this.memoryDecayRate = config.memoryDecayRate ?? 0.15;
    this.mistakeRate = config.mistakeRate ?? 0.20;
    this.memoryCapacity = config.memoryCapacity ?? 4;
    this.clock = 0;
  }

  onCardRevealed(index, card) {
    this.clock += 1;
    this.memory.set(index, { pairId: card.pairId, lastSeen: this.clock, strength: 1 });
    
    // Chance de esquecer outras cartas que estão na memória
    for (const [key, item] of this.memory.entries()) {
      item.strength *= (1 - this.memoryDecayRate);
      if (key !== index && Math.random() > item.strength) {
        this.memory.delete(key);
      }
    }

    // Limite explícito de itens: a IA não ganha memória perfeita apenas por observar.
    while (this.memory.size > this.memoryCapacity) {
      const oldest = [...this.memory.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0][0];
      this.memory.delete(oldest);
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
      
      for (const [idx, item] of this.memory.entries()) {
        if (item.pairId === targetPairId && idx !== firstCardIdx && !gameState.cards[idx].isMatched) {
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
        if (memoryArr[i][1].pairId === memoryArr[j][1].pairId) {
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
