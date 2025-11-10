from .agente_base import Agente
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from itertools import combinations
import random # Importe random para o caso de fallback

class AgenteKNN(Agente):
    def __init__(self, nome_jogador, X_treino_completo, y_treino_completo):
        super().__init__(nome_jogador, "Agente KNN")
        print(f"Treinando Agente KNN'Imperfeito' para {nome_jogador}...")

        X_train, X_test, y_train, y_test = train_test_split(
            X_treino_completo, y_treino_completo, test_size=0.3, random_state=42
        )
        
        self.knn = KNeighborsClassifier(n_neighbors=3)
        self.knn.fit(X_train, y_train)

        predicoes = self.knn.predict(X_test)
        acuracia = accuracy_score(y_test, predicoes)
        print(f" > Acurácia do KNN nos dados de teste (nos 30% que 'esqueceu'): {acuracia * 100:.2f}%")

        # --- ADICIONADO ---
        # Memória de curto prazo para jogadas que falharam
        self.pares_tentados_falhos = set()
    
    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2: return None, None

        melhor_jogada = None
        maior_prob = -1

        for i, j in combinations(indices_disponiveis, 2):
            
            # --- ADICIONADO: Verificação de falha ---
            # Normaliza a jogada (menor, maior) para checar na memória
            jogada_atual = (i, j) if i < j else (j, i)
            
            # Se já tentamos este par e ele falhou, pula
            if jogada_atual in self.pares_tentados_falhos:
                continue
            # --- FIM DA ADIÇÃO ---

            prob = self.knn.predict_proba([[i, j]])[0][1]
            
            if prob > maior_prob:
                maior_prob = prob
                melhor_jogada = (i, j)
        
        # --- ADICIONADO: Fallback ---
        # Se todas as jogadas possíveis já falharam (ou seja, melhor_jogada ainda é None)
        # recorre a uma jogada aleatória para não travar
        if melhor_jogada is None:
            #print(f"{self.nome_jogador} (KNN) não encontrou jogadas válidas, jogando aleatório.")
            return random.sample(indices_disponiveis, 2)
            
        return melhor_jogada

    # --- ADICIONADO: Método Aprender ---
    def aprender(self, jogada, recompensa):
        """ Aprende com o resultado (usado para memória de curto prazo) """
        if jogada is None: return
        
        # Normaliza a tupla (menor, maior)
        if jogada[0] > jogada[1]:
            jogada = (jogada[1], jogada[0])
            
        if recompensa == -1:
            # Se errou, adiciona este par à memória de "falhas"
            self.pares_tentados_falhos.add(jogada)
        elif recompensa == 1:
            pass