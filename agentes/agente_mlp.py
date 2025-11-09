from .agente_base import Agente
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from itertools import combinations

class AgenteMLP(Agente):
    def __init__(self, nome_jogador, X_treino_completo, y_treino_completo):
        super().__init__(nome_jogador, "Agente MLP (Estático)")
        print(f"Treinando Agente MLP 'Imperfeito' para {nome_jogador}...")

        X_train, X_test, y_train, y_test = train_test_split(
            X_treino_completo, y_treino_completo, test_size=0.3, random_state=42
        )

        self.mlp = MLPClassifier(hidden_layer_sizes=(20, 10), max_iter=1000, random_state=1)
        self.mlp.fit(X_train, y_train)
        
        predicoes = self.mlp.predict(X_test)
        acuracia = accuracy_score(y_test, predicoes)
        print(f" > Acurácia do MLP nos dados de teste (nos 30% que 'esqueceu'): {acuracia * 100:.2f}%")

    
    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2: return None, None

        melhor_jogada = None
        maior_prob = -1

        for i, j in combinations(indices_disponiveis, 2):
            prob = self.mlp.predict_proba([[i, j]])[0][1] # Probabilidade da classe "1"
            
            if prob > maior_prob:
                maior_prob = prob
                melhor_jogada = (i, j)
        
        return melhor_jogada