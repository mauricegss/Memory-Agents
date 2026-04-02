import numpy as np
from itertools import combinations

def gerar_dados_treino(tabuleiro):
    """ Gera o gabarito (X, y) para o tabuleiro fixo """
    entradas = []
    saidas = []
    indices = list(range(len(tabuleiro)))
    
    for i, j in combinations(indices, 2):
        entradas.append([i, j])
        saidas.append(1 if tabuleiro[i] == tabuleiro[j] else 0)
        
    return np.array(entradas), np.array(saidas)

def pre_treinar_agente_ql(agente, tabuleiro, iteracoes):
    """ Simula jogos rápidos para o Q-Learning aprender o gabarito """
    print(f"Pré-treinando Agente Q-Learning por {iteracoes} jogos...")
    for _ in range(iteracoes):
        disponiveis = list(range(len(tabuleiro)))
        while len(disponiveis) >= 2:
            idx1, idx2 = agente.fazer_jogada(disponiveis)
            
            if idx1 not in disponiveis or idx2 not in disponiveis:
                continue

            if tabuleiro[idx1] == tabuleiro[idx2]:
                reward = 1
                disponiveis.remove(idx1)
                disponiveis.remove(idx2)
            else:
                reward = -1
            
            agente.aprender((idx1, idx2), reward)
    print("Pré-treino completo.")