import pygame
import random
import time

# Importa tudo do config e dos agentes
from config import *
# Importa o PACOTE 'agentes'. O __init__.py cuida de nos dar tudo.
from agentes import *

# --- Classes do Jogo ---

class Carta:
    """ Representa uma carta no tabuleiro """
    def __init__(self, x, y, largura, altura, valor):
        self.rect = pygame.Rect(x, y, largura, altura)
        self.valor = valor
        self.virada = False
        self.encontrada = False
    
    def desenhar(self, tela, fonte_grande):
        if self.encontrada:
            pygame.draw.rect(tela, COR_MATCH, self.rect, border_radius=5)
        elif self.virada:
            pygame.draw.rect(tela, COR_CARTA_FRENTE, self.rect, border_radius=5)
            texto_render = fonte_grande.render(str(self.valor), True, COR_PRETA)
            text_rect = texto_render.get_rect(center=self.rect.center)
            tela.blit(texto_render, text_rect)
        else:
            pygame.draw.rect(tela, COR_CARTA, self.rect, border_radius=5)

    def esta_sobre(self, pos_mouse):
        return self.rect.collidepoint(pos_mouse)

class JogoDaMemoria:
    """ Classe principal que gerencia o estado do jogo """
    def __init__(self, tela, fonte_media, fonte_pequena, fonte_grande):
        self.tela = tela
        self.fonte_media = fonte_media
        self.fonte_pequena = fonte_pequena
        self.fonte_grande = fonte_grande
        self.estado = "MENU" # MENU, ESPIAR, JOGANDO, FIM
        self.cartas = []
        self.agentes = {}
        self.tipo_agentes = {
            "P1": "Humano",
            "P2": "Agente com Memória"
        }
        
        self.jogador_atual = "P1"
        self.selecionadas = []
        self.timer_estado = 0
        self.pontos = {"P1": 0, "P2": 0}
        self.valores_cartas = [] # Armazena os valores do tabuleiro atual
        
        # Dados de treino agora são dinâmicos
        self.X_treino_atual = None
        self.y_treino_atual = None
        
        # Agente Q-Learning precisa persistir, mas será treinado dinamicamente
        self.agente_q_learning_global = AgenteQLearning("Global")

    # --- FUNÇÃO ATUALIZADA PARA O GRID 4x4 ---
    def iniciar_novo_jogo(self):
        
        # --- ETAPA 1: Gerar tabuleiro aleatório ---
        # Esta parte agora é padrão, não mais uma "opção"
        self.valores_cartas = []
        for i in range(1, (N_CARTAS // 2) + 1): # Vai de 1 a 8
            self.valores_cartas.append(i)
            self.valores_cartas.append(i)
        random.shuffle(self.valores_cartas)
        
        
        # --- ETAPA 2: (RE)TREINAR IAs NESTE TABULEIRO ---
        print(f"Gerando tabuleiro e (re)treinando IAs (MLP, KNN, QL)...")
        
        # 1. Gerar os dados de treino para este tabuleiro específico
        self.X_treino_atual, self.y_treino_atual = gerar_dados_treino(self.valores_cartas)
        
        # 2. Re-treinar o agente Q-Learning global para este gabarito
        self.agente_q_learning_global.q_table = {} # Limpa a memória anterior
        pre_treinar_agente_ql(self.agente_q_learning_global, self.valores_cartas, 500)
        
        print("Treinamento de IAs para esta rodada concluído.")
        
        # --- ETAPA 3: Configurar o layout e estado do jogo (como antes) ---
        self.cartas = []
        espacamento = 10
        
        largura_carta = 100
        altura_carta = 140
        
        largura_total_cartas = (largura_carta * N_COLUNAS) + (espacamento * (N_COLUNAS - 1))
        altura_total_cartas = (altura_carta * N_LINHAS) + (espacamento * (N_LINHAS - 1))
        
        x_inicio = (LARGURA_TELA - largura_total_cartas) / 2
        y_inicio = (ALTURA_TELA - altura_total_cartas - 50) / 2 # Sobe um pouco
        
        for i in range(N_CARTAS):
            linha = i // N_COLUNAS 
            coluna = i % N_COLUNAS
            
            x = x_inicio + (coluna * (largura_carta + espacamento))
            y = y_inicio + (linha * (altura_carta + espacamento))
            nova_carta = Carta(x, y, largura_carta, altura_carta, self.valores_cartas[i])
            self.cartas.append(nova_carta)

        # Configurar agentes
        self.agentes = {
            "P1": self.criar_agente(self.tipo_agentes["P1"], "P1"),
            "P2": self.criar_agente(self.tipo_agentes["P2"], "P2")
        }

        self.pontos = {"P1": 0, "P2": 0}
        self.jogador_atual = "P1"
        self.selecionadas = []
        self.estado = "ESPIAR"
        self.timer_estado = time.time()
    # --- FIM DA FUNÇÃO ATUALIZADA ---

    def criar_agente(self, tipo, nome_jogador):
        if tipo == "Humano":
            return AgenteHumano(nome_jogador)
        if tipo == "Agente Aleatório":
            return AgenteAleatorio(nome_jogador)
        if tipo == "Agente com Memória":
            return AgenteComMemoria(nome_jogador)
            
        # MUDANÇA AQUI: Passa os dados de treino ATUAIS
        if tipo == "Agente MLP (Estático)":
            return AgenteMLP(nome_jogador, self.X_treino_atual, self.y_treino_atual)
        if tipo == "Agente KNN (Estático)":
            return AgenteKNN(nome_jogador, self.X_treino_atual, self.y_treino_atual)
            
        if tipo == "Agente Q-Learning":
            # Usa o agente global pré-treinado (agora treinado no tabuleiro atual)
            return self.agente_q_learning_global 
        
        return AgenteHumano(nome_jogador)

    def loop(self, eventos):
        if self.estado == "MENU":
            self.desenhar_menu()
            self.lidar_eventos_menu(eventos)
        elif self.estado == "ESPIAR":
            self.desenhar_tabuleiro(espiar=True)
            self.desenhar_hud()
            if time.time() - self.timer_estado > TEMPO_ESPIAR:
                # Vira todas as cartas de volta para baixo
                for carta in self.cartas:
                    carta.virada = False
                self.estado = "JOGANDO"
        elif self.estado == "JOGANDO":
            self.desenhar_tabuleiro()
            self.desenhar_hud()
            self.logica_jogo(eventos)
        elif self.estado == "FIM":
            self.desenhar_tabuleiro()
            self.desenhar_hud()
            self.desenhar_fim_jogo()
            self.lidar_eventos_menu(eventos)

    def desenhar_menu(self):
        self.tela.fill(COR_FUNDO)
        
        texto_titulo = self.fonte_media.render("Jogo da Memória com IA", True, COR_BRANCA)
        self.tela.blit(texto_titulo, (LARGURA_TELA/2 - texto_titulo.get_width()/2, 50))

        # --- Seleção P1 (Esquerda) ---
        texto_p1 = self.fonte_pequena.render("Jogador 1:", True, COR_BRANCA)
        self.tela.blit(texto_p1, (50, 150))
        self.btn_p1_humano = self.desenhar_botao(self.tela, "Humano", 50, 190, self.tipo_agentes["P1"] == "Humano")
        self.btn_p1_random = self.desenhar_botao(self.tela, "Ag. Aleatório", 50, 240, self.tipo_agentes["P1"] == "Agente Aleatório")
        self.btn_p1_memoria = self.desenhar_botao(self.tela, "Ag. com Memória", 50, 290, self.tipo_agentes["P1"] == "Agente com Memória")
        self.btn_p1_mlp = self.desenhar_botao(self.tela, "Ag. MLP (Estático)", 50, 340, self.tipo_agentes["P1"] == "Agente MLP (Estático)")
        self.btn_p1_knn = self.desenhar_botao(self.tela, "Ag. KNN (Estático)", 50, 390, self.tipo_agentes["P1"] == "Agente KNN (Estático)")
        self.btn_p1_ql = self.desenhar_botao(self.tela, "Ag. Q-Learning", 50, 440, self.tipo_agentes["P1"] == "Agente Q-Learning")

        # --- Seleção P2 (Direita) ---
        texto_p2 = self.fonte_pequena.render("Jogador 2:", True, COR_BRANCA)
        self.tela.blit(texto_p2, (LARGURA_TELA - 300, 150))
        self.btn_p2_humano = self.desenhar_botao(self.tela, "Humano", 500, 190, self.tipo_agentes["P2"] == "Humano")
        self.btn_p2_random = self.desenhar_botao(self.tela, "Ag. Aleatório", 500, 240, self.tipo_agentes["P2"] == "Agente Aleatório")
        self.btn_p2_memoria = self.desenhar_botao(self.tela, "Ag. com Memória", 500, 290, self.tipo_agentes["P2"] == "Agente com Memória")
        self.btn_p2_mlp = self.desenhar_botao(self.tela, "Ag. MLP (Estático)", 500, 340, self.tipo_agentes["P2"] == "Agente MLP (Estático)")
        self.btn_p2_knn = self.desenhar_botao(self.tela, "Ag. KNN (Estático)", 500, 390, self.tipo_agentes["P2"] == "Agente KNN (Estático)")
        self.btn_p2_ql = self.desenhar_botao(self.tela, "Ag. Q-Learning", 500, 440, self.tipo_agentes["P2"] == "Agente Q-Learning")

        # --- Iniciar ---
        self.btn_iniciar = self.desenhar_botao(self.tela, "INICIAR JOGO", LARGURA_TELA/2 - 125, 520, True, (250, 50))


    def desenhar_botao(self, tela, texto, x, y, ativo, tamanho=(250, 40)):
        rect = pygame.Rect(x, y, tamanho[0], tamanho[1])
        cor_fundo = COR_DESTAQUE if ativo else COR_CARTA
        
        pygame.draw.rect(tela, cor_fundo, rect, border_radius=5)
        
        texto_render = self.fonte_pequena.render(texto, True, COR_BRANCA)
        tela.blit(texto_render, (x + (tamanho[0] - texto_render.get_width())/2, y + (tamanho[1] - texto_render.get_height())/2))
        return rect

    def lidar_eventos_menu(self, eventos):
        for evento in eventos:
            if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
                pos_mouse = pygame.mouse.get_pos()
                
                if self.estado == "FIM":
                    self.estado = "MENU"
                    return

                # Botões P1
                if self.btn_p1_humano.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Humano"
                if self.btn_p1_random.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Agente Aleatório"
                if self.btn_p1_memoria.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Agente com Memória"
                if self.btn_p1_mlp.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Agente MLP (Estático)"
                if self.btn_p1_knn.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Agente KNN (Estático)"
                if self.btn_p1_ql.collidepoint(pos_mouse): self.tipo_agentes["P1"] = "Agente Q-Learning"
                
                # Botões P2
                if self.btn_p2_humano.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Humano"
                if self.btn_p2_random.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Agente Aleatório"
                if self.btn_p2_memoria.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Agente com Memória"
                if self.btn_p2_mlp.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Agente MLP (Estático)"
                if self.btn_p2_knn.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Agente KNN (Estático)"
                if self.btn_p2_ql.collidepoint(pos_mouse): self.tipo_agentes["P2"] = "Agente Q-Learning"

                # Botão Iniciar
                if self.btn_iniciar.collidepoint(pos_mouse):
                    self.iniciar_novo_jogo()

    def desenhar_tabuleiro(self, espiar=False):
        self.tela.fill(COR_FUNDO)
        pos_mouse = pygame.mouse.get_pos()
        
        for i, carta in enumerate(self.cartas):
            if espiar: carta.virada = True
            carta.desenhar(self.tela, self.fonte_grande)
            
            if not carta.virada and not carta.encontrada and carta.esta_sobre(pos_mouse):
                if self.agentes[self.jogador_atual].tipo == "Humano":
                    pygame.draw.rect(self.tela, COR_DESTAQUE, carta.rect, 4, border_radius=5)

    def desenhar_hud(self):
        # Placar P1
        cor_p1, nome_p1 = self.get_info_agente(self.tipo_agentes["P1"])
        self.desenhar_placar("P1", nome_p1, cor_p1, (20, 20), (20, 50), "esquerda")

        # Placar P2
        cor_p2, nome_p2 = self.get_info_agente(self.tipo_agentes["P2"])
        self.desenhar_placar("P2", nome_p2, cor_p2, (LARGURA_TELA - 20, 20), (LARGURA_TELA - 20, 50), "direita")

    def get_info_agente(self, tipo):
        if tipo == "Humano": return COR_HUMANO, "Humano"
        if tipo == "Agente Aleatório": return COR_IA_RANDOM, "Ag. Aleatório"
        if tipo == "Agente com Memória": return COR_IA_MEMORIA, "Ag. Memória"
        if tipo == "Agente MLP (Estático)": return COR_IA_SUPERV, "Ag. MLP"
        if tipo == "Agente KNN (Estático)": return COR_IA_SUPERV, "Ag. KNN"
        if tipo == "Agente Q-Learning": return COR_IA_QL, "Ag. Q-Learning"
        return COR_BRANCA, "Desconhecido"

    def desenhar_placar(self, jogador, nome, cor, pos_nome, pos_placar, align="esquerda"):
        texto_nome = f"{jogador}: {nome}"
        texto_placar = f"Pontos: {self.pontos[jogador]}"
        
        render_nome = self.fonte_pequena.render(texto_nome, True, cor)
        render_placar = self.fonte_media.render(texto_placar, True, cor)
        
        if align == "direita":
            pos_nome = (pos_nome[0] - render_nome.get_width(), pos_nome[1])
            pos_placar = (pos_placar[0] - render_placar.get_width(), pos_placar[1])
        
        self.tela.blit(render_nome, pos_nome)
        self.tela.blit(render_placar, pos_placar)
        
        if self.jogador_atual == jogador:
            y_pos_marcador = pos_nome[1]
            x_pos_marcador = pos_nome[0] - 10 if align == "esquerda" else pos_nome[0] + render_nome.get_width() + 5
            if align == "esquerda":
                pygame.draw.rect(self.tela, cor, (x_pos_marcador + 5, y_pos_marcador - 5, 5, 70))
            else:
                pygame.draw.rect(self.tela, cor, (x_pos_marcador - 5, y_pos_marcador - 5, 5, 70))


    def desenhar_fim_jogo(self):
        overlay = pygame.Surface((LARGURA_TELA, ALTURA_TELA))
        overlay.set_alpha(200)
        overlay.fill(COR_PRETA)
        self.tela.blit(overlay, (0, 0))

        if self.pontos["P1"] == self.pontos["P2"]: vencedor_txt = "Empate!"
        elif self.pontos["P1"] > self.pontos["P2"]: vencedor_txt = f"Jogador 1 Venceu!"
        else: vencedor_txt = f"Jogador 2 Venceu!"
        
        texto = self.fonte_media.render(vencedor_txt, True, COR_BRANCA)
        self.tela.blit(texto, (LARGURA_TELA/2 - texto.get_width()/2, ALTURA_TELA/2 - texto.get_height()/2 - 50))
        
        texto_reset = self.fonte_pequena.render("Clique para voltar ao Menu", True, COR_BRANCA)
        self.tela.blit(texto_reset, (LARGURA_TELA/2 - texto_reset.get_width()/2, ALTURA_TELA/2 + 20))

    def logica_jogo(self, eventos):
        agente_ativo = self.agentes[self.jogador_atual]

        if agente_ativo.tipo == "Humano":
            for evento in eventos:
                if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
                    if len(self.selecionadas) < 2:
                        self.clique_humano(pygame.mouse.get_pos())
        
        elif agente_ativo.tipo != "Humano":
            if len(self.selecionadas) == 0:
                pygame.time.wait(200) # Pausa para IA
                
                disponiveis = [i for i, c in enumerate(self.cartas) if not c.encontrada]
                idx1, idx2 = agente_ativo.fazer_jogada(disponiveis)
                
                if idx1 is not None and idx2 is not None and idx1 != idx2:
                    if idx1 > idx2: idx1, idx2 = idx2, idx1
                    
                    agente_ativo.ultima_jogada = (idx1, idx2)
                    
                    carta1 = self.cartas[idx1]
                    carta2 = self.cartas[idx2]
                    
                    self.notificar_agentes(idx1, carta1.valor)
                    self.notificar_agentes(idx2, carta2.valor)
                    
                    carta1.virada = True
                    carta2.virada = True
                    self.selecionadas = [carta1, carta2]
                    self.timer_estado = time.time()

        if len(self.selecionadas) == 2:
            if time.time() - self.timer_estado > TEMPO_REVELAR:
                self.checar_par()

    def clique_humano(self, pos_mouse):
        for i, carta in enumerate(self.cartas):
            if carta.esta_sobre(pos_mouse) and not carta.virada and not carta.encontrada:
                carta.virada = True
                self.selecionadas.append(carta)
                self.notificar_agentes(i, carta.valor)

                if len(self.selecionadas) == 2:
                    self.timer_estado = time.time()
                break

    def checar_par(self):
        carta1, carta2 = self.selecionadas
        agente_ativo = self.agentes[self.jogador_atual]
        reward = 0
        
        if carta1.valor == carta2.valor:
            carta1.encontrada = True
            carta2.encontrada = True
            self.pontos[self.jogador_atual] += 1
            reward = 1
        else:
            carta1.virada = False
            carta2.virada = False
            self.jogador_atual = "P2" if self.jogador_atual == "P1" else "P1"
            reward = -1

        if hasattr(agente_ativo, 'aprender'):
            agente_ativo.aprender(agente_ativo.ultima_jogada, reward)

        self.selecionadas = []
        
        if all(c.encontrada for c in self.cartas):
            self.estado = "FIM"

    def notificar_agentes(self, indice_carta, valor_carta):
        for agente in self.agentes.values():
            agente.observar(indice_carta, valor_carta)