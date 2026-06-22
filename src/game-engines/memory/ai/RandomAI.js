import { AIStrategyBase } from './AIStrategyBase';

export class RandomAI extends AIStrategyBase {
  async chooseNextCard(gameState) {
    const available = gameState.cards
      .map((c, i) => (!c.isMatched && !c.isFlipped ? i : -1))
      .filter(i => i !== -1);
      
    if (available.length === 0) return null;
    
    return available[Math.floor(Math.random() * available.length)];
  }
}
