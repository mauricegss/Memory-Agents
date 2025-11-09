import random
from .agente_base import Agente

class AgenteAleatorio(Agente):
    def __init__(self, nome_jogador):
        super().__init__(nome_jogador, "Agente Aleatório")
    
    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2:
            return None, None
        return random.sample(indices_disponiveis, 2)