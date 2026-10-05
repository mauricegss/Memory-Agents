import random
import sys
import os

# Ensure we can import the agent
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-engine'))
from agentes.agente_memoria import AgenteComMemoria

class AgenteAleatorio:
    def __init__(self):
        self.nivel = "aleatorio"
        self.pares_por_memoria = 0
        self.pares_por_acaso = 0
    def observar(self, indice, valor):
        pass
    def notificar_par_encontrado(self, i1, i2, por_memoria=False):
        pass
    def fazer_jogada(self, disponiveis):
        if len(disponiveis) < 2: return None, None
        return tuple(random.sample(list(disponiveis), 2))
    def resetar(self):
        pass

class JogoMemoria:
    def __init__(self, agente1, agente2, n_pares=8):
        self.n_pares = n_pares
        self.n_cartas = n_pares * 2
        self.tabuleiro = list(range(n_pares)) * 2
        random.shuffle(self.tabuleiro)
        self.disponiveis = set(range(self.n_cartas))
        
        self.agentes = [agente1, agente2]
        self.placar = [0, 0]
        self.turno_atual = 0 # 0 para agente1, 1 para agente2
        self.turnos_jogados = 0
        
    def jogar(self):
        self.agentes[0].resetar()
        self.agentes[1].resetar()
        
        while len(self.disponiveis) > 0:
            agente = self.agentes[self.turno_atual]
            self.turnos_jogados += 1
            
            jogada = agente.fazer_jogada(self.disponiveis)
            if not jogada or len(jogada) != 2:
                # Fallback se não conseguir jogar
                break
                
            idx1, idx2 = jogada
            val1 = self.tabuleiro[idx1]
            val2 = self.tabuleiro[idx2]
            
            # Todos observam as cartas reveladas
            for a in self.agentes:
                a.observar(idx1, val1)
                a.observar(idx2, val2)
                
            if val1 == val2:
                self.placar[self.turno_atual] += 1
                self.disponiveis.remove(idx1)
                self.disponiveis.remove(idx2)
                
                if hasattr(agente, 'memoria'):
                    if idx1 in agente.memoria and idx2 in agente.memoria:
                        agente.notificar_par_encontrado(idx1, idx2, True)
                    else:
                        agente.notificar_par_encontrado(idx1, idx2, False)
                # Acertou, joga de novo
            else:
                # Errou, passa a vez
                self.turno_atual = 1 - self.turno_atual
                
        return 0 if self.placar[0] > self.placar[1] else (1 if self.placar[1] > self.placar[0] else -1)

def simular_cenario(tipo_a, tipo_b, n_partidas=1000):
    vitorias = [0, 0, 0] # a, b, empates
    turnos_totais = 0
    
    agentes = []
    for tipo in [tipo_a, tipo_b]:
        if tipo == "aleatorio":
            agentes.append(AgenteAleatorio())
        else:
            agentes.append(AgenteComMemoria(nivel=tipo))
            
    for _ in range(n_partidas):
        jogo = JogoMemoria(agentes[0], agentes[1])
        resultado = jogo.jogar()
        if resultado == -1:
            vitorias[2] += 1
        else:
            vitorias[resultado] += 1
        turnos_totais += jogo.turnos_jogados
        
    return {
        "vitorias_a": vitorias[0],
        "vitorias_b": vitorias[1],
        "empates": vitorias[2],
        "turnos_medios": turnos_totais / n_partidas
    }

if __name__ == "__main__":
    print("Iniciando simulações (1000 partidas cada)...")
    cenarios = [
        ("aleatorio", "aleatorio"),
        ("facil", "aleatorio"),
        ("medio", "aleatorio"),
        ("dificil", "aleatorio"),
        ("dificil", "facil"),
        ("dificil", "medio"),
        ("medio", "facil")
    ]
    
    for c in cenarios:
        res = simular_cenario(c[0], c[1], 1000)
        print(f"{c[0].upper():>10} vs {c[1].upper():<10} | Vit: {res['vitorias_a']:>4} x {res['vitorias_b']:<4} | Empates: {res['empates']:>3} | Turnos (médio): {res['turnos_medios']:.1f}")
