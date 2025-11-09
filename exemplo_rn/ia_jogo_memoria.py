import json
import random
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

mlp = None
possibilidades_jogadas = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9],
                          [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
                            [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [2, 9],
                            [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
                            [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
                            [5, 6], [5, 7], [5, 8], [5, 9],
                            [6, 7], [6, 8], [6, 9],
                            [7, 8], [7, 9],
                            [8, 9]]

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

def treinar_mlp(entradas, esperados):

    x = entradas
    y = esperados

    X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.1, random_state=42)

    mlp = MLPClassifier(hidden_layer_sizes=(50, 100), activation='logistic', solver='sgd', max_iter=1000, random_state=42)
    mlp.fit(X_train, y_train)

    return mlp

def fazer_jogada(lista_cartas):
    
    global mlp, possibilidades_jogadas
    
    indices_cartas = [i for i, carta in enumerate(lista_cartas) if carta.dono is None]

    # se alguma carta for virada, ela não pode ser jogada
    for jogada in possibilidades_jogadas:
        if jogada[0] not in indices_cartas or jogada[1] not in indices_cartas:
            possibilidades_jogadas.remove(jogada)

    if mlp == None:
        entradas, esperados = carregar_dados_tabuleiro()
        mlp = treinar_mlp(entradas, esperados)
    
    primeira_carta = random.choice(indices_cartas)
    
    melhor_segunda_carta = None
    melhor_saida = float('-inf')

    for indice_carta in indices_cartas:
        if indice_carta != primeira_carta:
            if primeira_carta > indice_carta:
                entrada = np.array([[indice_carta, primeira_carta]])
            else:
                entrada = np.array([[primeira_carta, indice_carta]])
            saida = mlp.predict(entrada)

            if saida > melhor_saida:
                melhor_segunda_carta = indice_carta
                melhor_saida = saida

    try:
    
        if primeira_carta > melhor_segunda_carta:
            possibilidades_jogadas.remove([melhor_segunda_carta, primeira_carta])
        else:
            possibilidades_jogadas.remove([primeira_carta, melhor_segunda_carta])

    except Exception as e:
        # print("Caiu na exceção", e)
        pass

    return lista_cartas[primeira_carta], lista_cartas[melhor_segunda_carta]
    