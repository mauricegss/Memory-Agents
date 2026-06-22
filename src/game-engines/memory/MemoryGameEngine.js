import { shuffleArray } from '../../utils/shuffle';

export class MemoryGameEngine {
  constructor(cardPairs) {
    this.cards = this._generateCards(cardPairs);
    this.score = { player: 0, ai: 0 };
    this.flippedIndices = [];
    this.matchedPairs = new Set();
    this.turn = 'player'; // 'player' ou 'ai'
  }

  _generateCards(cardPairs) {
    let deck = [];
    cardPairs.forEach((pair, index) => {
      // As cartas podem vir do DB, então mapeamos de forma defensiva
      deck.push({ 
        type: pair.item1_type || 'image', 
        content: pair.item1_content || pair.emoji || '❓', 
        pairId: index, 
        id: `cardA_${index}` 
      });
      deck.push({ 
        type: pair.item2_type || 'image', 
        content: pair.item2_content || pair.emoji || '❓', 
        pairId: index, 
        id: `cardB_${index}` 
      });
    });
    return shuffleArray(deck);
  }

  flipCard(index) {
    if (this.flippedIndices.length >= 2) return false;
    if (this.flippedIndices.includes(index)) return false;
    if (this.matchedPairs.has(this.cards[index].pairId)) return false;

    this.flippedIndices.push(index);
    return true;
  }

  checkMatch() {
    if (this.flippedIndices.length !== 2) return null;
    
    const [idx1, idx2] = this.flippedIndices;
    const card1 = this.cards[idx1];
    const card2 = this.cards[idx2];
    
    const isMatch = card1.pairId === card2.pairId;
    
    if (isMatch) {
      this.matchedPairs.add(card1.pairId);
      this.score[this.turn] += 10;
    }
    
    return { isMatch, idx1, idx2 };
  }

  clearFlipped() {
    this.flippedIndices = [];
  }

  switchTurn() {
    this.turn = this.turn === 'player' ? 'ai' : 'player';
  }

  isGameOver() {
    return this.matchedPairs.size === this.cards.length / 2;
  }

  getState() {
    return {
      cards: this.cards.map((c, i) => ({
        ...c,
        isFlipped: this.flippedIndices.includes(i) || this.matchedPairs.has(c.pairId),
        isMatched: this.matchedPairs.has(c.pairId)
      })),
      score: { ...this.score },
      turn: this.turn,
      gameOver: this.isGameOver()
    };
  }
}
