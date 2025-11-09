import json, numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def carregar_dados_tabuleiro(arquivo="./scripts/jogo_memoria/tabuleiro_treino.json"):
    with open(arquivo, 'r') as f:
        dados = json.load(f)
        possibilidades_jogadas = dados["possibilidades_jogadas"]
        entradas = []
        esperados = []
        for jogada in possibilidades_jogadas:
            entradas.append(jogada["entrada"])
            esperados.append(jogada["saida"])
        return entradas, esperados

def mlp(entradas, esperados):

    x = np.array(entradas)
    y = np.array(esperados)

    X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.1, random_state=42)

    mlp = MLPClassifier(hidden_layer_sizes=(50, 100), activation='logistic', solver='sgd', max_iter=1000, random_state=42)
    mlp.fit(X_train, y_train)

    predictions = mlp.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    print("Acurácia do MLP:", accuracy)
    # pesos_camadas_ocultas = mlp.coefs_
    # pesos_bias = mlp.intercepts_
    # print("Pesos das camadas ocultas:", pesos_camadas_ocultas)
    # print("Pesos dos bias:", pesos_bias)

entradas, esperados = carregar_dados_tabuleiro()
mlp(entradas, esperados)