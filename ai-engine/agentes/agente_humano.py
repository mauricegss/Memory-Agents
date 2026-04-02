from .agente_base import Agente

class AgenteHumano(Agente):
    def __init__(self, nome_jogador):
        super().__init__(nome_jogador, "Humano")