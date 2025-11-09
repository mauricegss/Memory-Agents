import pygame

# --- Configurações do Jogo ---
# Cores
COR_BRANCA = (255, 255, 255)
COR_PRETA = (0, 0, 0)
COR_FUNDO = (30, 30, 30)
COR_CARTA = (70, 70, 70)
COR_CARTA_FRENTE = (230, 230, 230)
COR_DESTAQUE = (150, 150, 150)
COR_MATCH = (0, 150, 0)

# Cores dos Agentes
COR_HUMANO = (66, 135, 245)
COR_IA_MEMORIA = (245, 132, 66)
COR_IA_RANDOM = (219, 66, 245)
COR_IA_SUPERV = (245, 227, 66) # MLP/KNN
COR_IA_QL = (66, 245, 164) # Q-Learning

# Tela
LARGURA_TELA = 800
ALTURA_TELA = 650 

# Tabuleiro
N_CARTAS = 16  # DEVE SER (N_COLUNAS * N_LINHAS)
N_COLUNAS = 4
N_LINHAS = 4

# Este é o gabarito (8 pares para N_CARTAS = 16)
TABULEIRO_FIXO = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]

# Timers
TEMPO_ESPIAR = 2.0
TEMPO_REVELAR = 0.5