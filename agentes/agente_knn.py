from .agente_base import Agente
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from itertools import combinations

class AgenteKNN(Agente):
    def __init__(self, nome_jogador, X_treino_completo, y_treino_completo):
        super().__init__(nome_jogador, "Agente KNN (Estático)")
        print(f"Treinando Agente KNN 'Imperfeito' para {nome_jogador}...")

        X_train, X_test, y_train, y_test = train_test_split(
            X_treino_completo, y_treino_completo, test_size=0.3, random_state=42
        )
        
        self.knn = KNeighborsClassifier(n_neighbors=3)
        self.knn.fit(X_train, y_train)

        predicoes = self.knn.predict(X_test)
        acuracia = accuracy_score(y_test, predicoes)
        print(f" > Acurácia do KNN nos dados de teste (nos 30% que 'esqueceu'): {acuracia * 100:.2f}%")

    
    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2: return None, None

        melhor_jogada = None
        maior_prob = -1

        for i, j in combinations(indices_disponiveis, 2):
            prob = self.knn.predict_proba([[i, j]])[0][1]
            
            if prob > maior_prob:
                maior_prob = prob
                melhor_jogada = (i, j)
        
        return melhor_jogada