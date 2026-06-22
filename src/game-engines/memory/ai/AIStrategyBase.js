export class AIStrategyBase {
  /**
   * Escolhe a PRÓXIMA carta para virar com base no estado atual.
   * Chamado uma vez para a primeira carta, e novamente para a segunda carta.
   * @param {Object} gameState - Estado atual do jogo
   * @returns {Promise<number|null>} - Índice da carta escolhida
   */
  // eslint-disable-next-line no-unused-vars
  async chooseNextCard(_gameState) {
    throw new Error('chooseNextCard must be implemented');
  }
  
  /**
   * Chamado quando uma carta é revelada na mesa (para a IA memorizar)
   * @param {number} index - Índice da carta
   * @param {Object} card - Objeto da carta
   */
  // eslint-disable-next-line no-unused-vars
  onCardRevealed(_index, _card) {}
}
