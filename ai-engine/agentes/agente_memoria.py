import random

# Parâmetros padrão por nível de dificuldade (Seção 6.1 — Fundamentação Teórica)
# Baseados em: Cowan (2001) para capacidade; Ebbinghaus (1885) e interferência para decay
NIVEIS = {
    "facil":  {"capacidade": 2,  "decaimento": 0.35, "taxa_erro": 0.30},
    "medio":  {"capacidade": 4,  "decaimento": 0.15, "taxa_erro": 0.12},
    "dificil":{"capacidade": 12, "decaimento": 0.03, "taxa_erro": 0.03},
}

FORCA_INICIAL = 1.0
FORCA_MINIMA  = 0.05


class AgenteComMemoria:
    """
    Agente heurístico com memória limitada e esquecimento por interferência.

    Modelos cognitivos implementados:
    - Capacidade limitada (Cowan, 2001): máximo C posições retidas.
    - Decaimento por interferência (Keppel & Underwood, 1962; Ebbinghaus, 1885):
      força_nova = força_anterior * (1 - d) a cada nova observação.
    - Efeito de recência: itens mais recentes têm força relativa maior.
    - Erro de recuperação (Peterson & Peterson, 1959): com probabilidade e,
      o agente ignora o par correto e explora aleatoriamente.
    """

    def __init__(self, nivel="medio"):
        params = NIVEIS.get(nivel, NIVEIS["medio"])
        self.nivel       = nivel
        self.capacidade  = params["capacidade"]
        self.decaimento  = params["decaimento"]
        self.taxa_erro   = params["taxa_erro"]
        self.memoria     = {}
        self.turno       = 0
        self.pares_por_memoria = 0
        self.pares_por_acaso   = 0

    def observar(self, indice, valor_carta):
        self.turno += 1
        a_esquecer = []
        for pos, item in self.memoria.items():
            if pos != indice:
                item["forca"] *= (1.0 - self.decaimento)
                if item["forca"] < FORCA_MINIMA:
                    a_esquecer.append(pos)
        for pos in a_esquecer:
            del self.memoria[pos]
        self.memoria[indice] = {"valor": valor_carta, "forca": FORCA_INICIAL, "recencia": self.turno}
        while len(self.memoria) > self.capacidade:
            mais_fraco = min(self.memoria, key=lambda p: self.memoria[p]["forca"])
            del self.memoria[mais_fraco]

    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2:
            return None, None
        disponiveis = set(indices_disponiveis)
        if random.random() < self.taxa_erro:
            return tuple(random.sample(sorted(disponiveis), 2))
        par_conhecido = self._buscar_par_na_memoria(disponiveis)
        if par_conhecido:
            return par_conhecido
        conhecidas    = [p for p in disponiveis if p in self.memoria]
        desconhecidas = [p for p in disponiveis if p not in self.memoria]
        if conhecidas and desconhecidas:
            return random.choice(conhecidas), random.choice(desconhecidas)
        if len(desconhecidas) >= 2:
            return tuple(random.sample(desconhecidas, 2))
        return tuple(random.sample(sorted(disponiveis), 2))

    def _buscar_par_na_memoria(self, disponiveis):
        grupos = {}
        for pos, item in self.memoria.items():
            if pos in disponiveis:
                grupos.setdefault(item["valor"], []).append(pos)
        pares = {v: p for v, p in grupos.items() if len(p) >= 2}
        if not pares:
            return None
        melhor = max(pares, key=lambda v: sum(self.memoria[p]["forca"] for p in pares[v][:2]))
        return pares[melhor][0], pares[melhor][1]

    def notificar_par_encontrado(self, idx1, idx2, por_memoria=False):
        self.memoria.pop(idx1, None)
        self.memoria.pop(idx2, None)
        if por_memoria:
            self.pares_por_memoria += 1
        else:
            self.pares_por_acaso += 1

    def resetar(self):
        self.memoria = {}
        self.turno   = 0
        self.pares_por_memoria = 0
        self.pares_por_acaso   = 0
