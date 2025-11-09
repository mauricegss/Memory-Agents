import random
from .agente_base import Agente
from itertools import combinations

class AgenteQLearning(Agente):
    def __init__(self, nome_jogador):
        super().__init__(nome_jogador, "Agente Q-Learning")
        self.q_table = {} 
        self.learning_rate = 0.1 
        self.discount_factor = 0.9
        self.epsilon = 0.1 
    
    def get_q_value(self, jogada):
        if jogada[0] > jogada[1]:
            jogada = (jogada[1], jogada[0])
        return self.q_table.get(jogada, 0)

    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2: return None, None
        
        if random.random() < self.epsilon:
            return random.sample(indices_disponiveis, 2)
        else:
            melhor_jogada = None
            melhor_q = float('-inf')
            
            for i, j in combinations(indices_disponiveis, 2):
                q_val = self.get_q_value((i, j))
                if q_val > melhor_q:
                    melhor_q = q_val
                    melhor_jogada = (i, j)
            
            if melhor_jogada is None: 
                return random.sample(indices_disponiveis, 2)

            return melhor_jogada

    def aprender(self, jogada, recompensa):
        if jogada is None: return
        
        if jogada[0] > jogada[1]:
            jogada = (jogada[1], jogada[0])

        old_q = self.get_q_value(jogada)
        novo_q = old_q + self.learning_rate * (recompensa - old_q)
        self.q_table[jogada] = novo_q