from .agente_base import Agente
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from itertools import combinations
import random # Importe random para o caso de fallback

class AgenteMLP(Agente):
    def __init__(self, nome_jogador, X_treino_completo, y_treino_completo):
        super().__init__(nome_jogador, "Agente MLP (Estático)")
        print(f"Treinando Agente MLP 'Imperfeito' para {nome_jogador}...")

        X_train, X_test, y_train, y_test = train_test_split(
            X_treino_completo, y_treino_completo, test_size=0.3, random_state=42
        )

        # --- MUDANÇA AQUI ---
        # Simplificamos a rede. (20, 10) era muito complexo (overfitting)
        # para apenas 84 amostras de treino. Uma camada de 10 é melhor.
        self.mlp = MLPClassifier(hidden_layer_sizes=(10,), max_iter=1000, random_state=1)
        # --- FIM DA MUDANÇA ---
        
        self.mlp.fit(X_train, y_train)
        
        predicoes = self.mlp.predict(X_test)
        acuracia = accuracy_score(y_test, predicoes)
        print(f" > Acurácia do MLP nos dados de teste (nos 30% que 'esqueceu'): {acuracia * 100:.2f}%")
        
        # --- ADICIONADO: Correção do Loop ---
        self.pares_tentados_falhos = set()
    
    def fazer_jogada(self, indices_disponiveis):
        if len(indices_disponiveis) < 2: return None, None

        melhor_jogada = None
        maior_prob = -1

        for i, j in combinations(indices_disponiveis, 2):
            
            # --- ADICIONADO: Verificação de falha ---
            jogada_atual = (i, j) if i < j else (j, i)
            if jogada_atual in self.pares_tentados_falhos:
                continue
            # --- FIM DA ADIÇÃO ---
            
            prob = self.mlp.predict_proba([[i, j]])[0][1] 
            
            if prob > maior_prob:
                maior_prob = prob
                melhor_jogada = (i, j)
        
        # --- ADICIONADO: Fallback ---
        if melhor_jogada is None:
            return random.sample(indices_disponiveis, 2)
            
        return melhor_jogada

    # --- ADICIONADO: Método Aprender (Correção do Loop) ---
    def aprender(self, jogada, recompensa):
        if jogada is None: return
        
        if jogada[0] > jogada[1]:
            jogada = (jogada[1], jogada[0])
            
        if recompensa == -1:
            self.pares_tentados_falhos.add(jogada)