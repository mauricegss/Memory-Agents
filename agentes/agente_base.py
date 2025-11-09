class Agente:
    """ Classe base para todos os agentes """
    def __init__(self, nome_jogador, tipo):
        self.nome_jogador = nome_jogador
        self.tipo = tipo
        self.ultima_jogada = None # Para o Q-Learning
    
    def observar(self, indice, valor_carta):
        """ Agente 'vê' uma carta (método para Ag. Memória) """
        pass
    
    def fazer_jogada(self, indices_disponiveis):
        """ Agente decide quais 2 cartas virar """
        return None, None
    
    def aprender(self, jogada, recompensa):
        """ Agente aprende com o resultado (método para Ag. QL) """
        pass