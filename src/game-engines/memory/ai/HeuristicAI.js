import { AIStrategyBase } from './AIStrategyBase.js';

/**
 * HeuristicAI — Agente heurístico com memória limitada e esquecimento por interferência.
 *
 * Modela três mecanismos cognitivos descritos na fundamentação teórica:
 *  1. Capacidade limitada (Cowan, 2001): máximo memoryCapacity posições retidas.
 *  2. Decaimento por interferência (Keppel & Underwood, 1962; Ebbinghaus, 1885):
 *     força_nova = força_anterior * (1 - memoryDecayRate) a cada nova observação.
 *  3. Erro de recuperação (Peterson & Peterson, 1959): com probabilidade mistakeRate,
 *     o agente ignora o par correto e escolhe aleatoriamente.
 *
 * Os parâmetros são alinhados com o agente Python (agente_memoria.py):
 *   Fácil:   { memoryCapacity: 2,  memoryDecayRate: 0.35, mistakeRate: 0.30 }
 *   Médio:   { memoryCapacity: 4,  memoryDecayRate: 0.15, mistakeRate: 0.12 }
 *   Difícil: { memoryCapacity: 12, memoryDecayRate: 0.03, mistakeRate: 0.03 }
 */

const FORCA_INICIAL = 1.0;
const FORCA_MINIMA  = 0.05;

export class HeuristicAI extends AIStrategyBase {
  constructor(config = {}) {
    super();
    // memory: Map<index, { pairId, strength, lastSeen }>
    this.memory          = new Map();
    this.memoryDecayRate = config.memoryDecayRate ?? 0.15;
    this.mistakeRate     = config.mistakeRate     ?? 0.12;
    this.memoryCapacity  = config.memoryCapacity  ?? 4;
    this.clock           = 0;
  }

  /**
   * Chamado sempre que qualquer jogador revela uma carta.
   * Aplica decaimento por interferência a todos os itens na memória,
   * atualiza ou insere a carta revelada e aplica o limite de capacidade.
   */
  onCardRevealed(index, card) {
    this.clock += 1;

    // 1. Aplicar decaimento por interferência em todos os itens já retidos
    const aEsquecer = [];
    for (const [key, item] of this.memory.entries()) {
      if (key !== index) {
        item.strength *= (1 - this.memoryDecayRate);
        if (item.strength < FORCA_MINIMA) {
          aEsquecer.push(key);
        }
      }
    }
    for (const key of aEsquecer) {
      this.memory.delete(key);
    }

    // 2. Inserir/atualizar a carta revelada com força máxima (efeito de recência)
    this.memory.set(index, {
      pairId:   card.pairId,
      strength: FORCA_INICIAL,
      lastSeen: this.clock,
    });

    // 3. Aplicar limite de capacidade: remove o item de menor força
    while (this.memory.size > this.memoryCapacity) {
      let maisFragil    = null;
      let menorForca    = Infinity;
      for (const [key, item] of this.memory.entries()) {
        if (item.strength < menorForca) {
          menorForca = item.strength;
          maisFragil = key;
        }
      }
      if (maisFragil !== null) this.memory.delete(maisFragil);
    }
  }

  /**
   * Escolhe a próxima carta a virar com base no estado atual do jogo.
   * Política em 4 etapas (espelhada no agente Python):
   *  1. Erro intencional com probabilidade mistakeRate.
   *  2. Carta já virada → procurar par na memória.
   *  3. Nenhuma carta virada → priorizar par conhecido.
   *  4. Sem par conhecido → explorar carta desconhecida (para coletar informação).
   */
  async chooseNextCard(gameState) {
    // Limpar da memória cartas que já formaram par
    gameState.cards.forEach((c, i) => {
      if (c.isMatched) this.memory.delete(i);
    });

    const available = gameState.cards
      .map((c, i) => (!c.isMatched && !c.isFlipped ? i : -1))
      .filter(i => i !== -1);

    if (available.length === 0) return null;

    // --- Etapa 1: Erro intencional ---
    if (Math.random() < this.mistakeRate) {
      return available[Math.floor(Math.random() * available.length)];
    }

    const flippedIndices = gameState.cards
      .map((c, i) => (c.isFlipped && !c.isMatched ? i : -1))
      .filter(i => i !== -1);

    // --- Etapa 2: Já tem uma carta virada → buscar par na memória ---
    if (flippedIndices.length === 1) {
      const targetPairId = gameState.cards[flippedIndices[0]].pairId;
      let melhorIdx      = null;
      let melhorForca    = -1;

      for (const [idx, item] of this.memory.entries()) {
        if (
          item.pairId === targetPairId &&
          idx !== flippedIndices[0]   &&
          !gameState.cards[idx].isMatched &&
          !gameState.cards[idx].isFlipped
        ) {
          if (item.strength > melhorForca) {
            melhorForca = item.strength;
            melhorIdx   = idx;
          }
        }
      }

      if (melhorIdx !== null) return melhorIdx;

      // Não lembrava do par: prioriza carta desconhecida (exploração)
      const desconhecidas = available.filter(i => !this.memory.has(i));
      if (desconhecidas.length > 0) {
        return desconhecidas[Math.floor(Math.random() * desconhecidas.length)];
      }
      return available[Math.floor(Math.random() * available.length)];
    }

    // --- Etapa 3: Nenhuma carta virada → procurar par completo na memória ---
    const memArr = Array.from(this.memory.entries()).filter(
      ([idx]) => !gameState.cards[idx].isMatched && !gameState.cards[idx].isFlipped
    );

    // Agrupa por pairId e verifica se há pelo menos dois itens do mesmo par
    const grupos = {};
    for (const [idx, item] of memArr) {
      if (!grupos[item.pairId]) grupos[item.pairId] = [];
      grupos[item.pairId].push({ idx, strength: item.strength });
    }

    let melhorPar   = null;
    let melhorScore = -1;
    for (const grupo of Object.values(grupos)) {
      if (grupo.length >= 2) {
        const score = grupo[0].strength + grupo[1].strength;
        if (score > melhorScore) {
          melhorScore = score;
          melhorPar   = [grupo[0].idx, grupo[1].idx];
        }
      }
    }

    if (melhorPar) return melhorPar[0]; // A segunda carta é escolhida na próxima chamada

    // --- Etapa 4: Exploração — prefere cartas desconhecidas ---
    const desconhecidas = available.filter(i => !this.memory.has(i));
    if (desconhecidas.length > 0) {
      return desconhecidas[Math.floor(Math.random() * desconhecidas.length)];
    }

    return available[Math.floor(Math.random() * available.length)];
  }
}
