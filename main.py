import pygame
from config import LARGURA_TELA, ALTURA_TELA
from jogo import JogoDaMemoria

# --- Função Principal (Main) ---

def main():
    pygame.init()
    pygame.font.init()
    
    tela = pygame.display.set_mode((LARGURA_TELA, ALTURA_TELA))
    pygame.display.set_caption("Jogo da Memória - Projeto IA Completo")
    
    # Fontes
    fonte_media = pygame.font.SysFont('Arial', 36, bold=True)
    fonte_pequena = pygame.font.SysFont('Arial', 20)
    fonte_grande = pygame.font.SysFont('Arial', 60, bold=True) # Para os números

    clock = pygame.time.Clock()

    # Cria o objeto principal do jogo
    jogo = JogoDaMemoria(tela, fonte_media, fonte_pequena, fonte_grande)
    
    rodando = True
    while rodando:
        eventos = pygame.event.get()
        for evento in eventos:
            if evento.type == pygame.QUIT:
                rodando = False
        
        # O loop principal do jogo cuida de todos os estados
        jogo.loop(eventos)

        pygame.display.flip()
        clock.tick(30) # Limita a 30 FPS

    pygame.quit()

if __name__ == "__main__":
    main()