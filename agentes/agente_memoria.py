import random
from .agente_base import Agente

class AgenteComMemoria(Agente):
    def __init__(self, nome_jogador):
        super().__init__(nome_jogador, "Agente com Memória")
        self.memoria = {} # {valor_carta: [lista_de_indices]}
        self.cartas_vistas = set()
    
    def observar(self, indice, valor_carta):
        if valor_carta not in self.memoria:
            self.memoria[valor_carta] = []
        if indice not in self.memoria[valor_carta]:
            self.memoria[valor_carta].append(indice)
        self.cartas_vistas.add(indice)
    
    def fazer_jogada(self, indices_disponiveis):
        desconhecidas = [i for i in indices_disponiveis if i not in self.cartas_vistas]
        
        # Estratégia 1: Par certo na memória
        for valor, indices in self.memoria.items():
            indices_disponiveis_desse_valor = [i for i in indices if i in indices_disponiveis]
            if len(indices_disponiveis_desse_valor) >= 2:
                return indices_disponiveis_desse_valor[0], indices_disponiveis_desse_valor[1]
        
        # Estratégia 2: Uma conhecida e uma desconhecida
        conhecidas_disponiveis = [i for i in indices_disponiveis if i in self.cartas_vistas]
        if conhecidas_disponiveis and desconhecidas:
            return random.choice(conhecidas_disponiveis), random.choice(desconhecidas)

        # Estratégia 3: Duas desconhecidas
        if len(desconhecidas) >= 2:
            return random.sample(desconhecidas, 2)
        
        # Estratégia 4: Duas aleatórias (último caso)
        if len(indices_disponiveis) >= 2:
            return random.sample(indices_disponiveis, 2)
            
        return None, None