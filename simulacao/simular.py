import random
import math
import sys
import os

# Garante que o módulo do agente pode ser importado
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-engine'))
from agentes.agente_memoria import AgenteComMemoria


# ---------------------------------------------------------------------------
# Agente baseline: joga aleatoriamente (sem memória)
# ---------------------------------------------------------------------------
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
        if len(disponiveis) < 2:
            return None, None
        return tuple(random.sample(sorted(disponiveis), 2))

    def resetar(self):
        self.pares_por_memoria = 0
        self.pares_por_acaso = 0


# ---------------------------------------------------------------------------
# Motor do Jogo da Memória
# ---------------------------------------------------------------------------
class JogoMemoria:
    def __init__(self, agente1, agente2, n_pares=8):
        self.n_pares = n_pares
        self.n_cartas = n_pares * 2
        self.tabuleiro = list(range(n_pares)) * 2
        random.shuffle(self.tabuleiro)
        self.disponiveis = set(range(self.n_cartas))

        self.agentes = [agente1, agente2]
        self.placar = [0, 0]
        self.turno_atual = 0
        self.turnos_jogados = 0

    def jogar(self):
        self.agentes[0].resetar()
        self.agentes[1].resetar()

        while len(self.disponiveis) > 0:
            agente = self.agentes[self.turno_atual]
            self.turnos_jogados += 1

            jogada = agente.fazer_jogada(self.disponiveis)
            if not jogada or len(jogada) != 2:
                break

            idx1, idx2 = jogada
            val1 = self.tabuleiro[idx1]
            val2 = self.tabuleiro[idx2]

            # Ambos os agentes observam as cartas reveladas
            for a in self.agentes:
                a.observar(idx1, val1)
                a.observar(idx2, val2)

            if val1 == val2:
                self.placar[self.turno_atual] += 1
                self.disponiveis.discard(idx1)
                self.disponiveis.discard(idx2)
                # Detecta se o par foi encontrado por memória ou acaso
                if hasattr(agente, 'memoria'):
                    em_memoria = idx1 in agente.memoria or idx2 in agente.memoria
                    agente.notificar_par_encontrado(idx1, idx2, em_memoria)
                # Acertou: mantém o turno
            else:
                # Errou: passa a vez
                self.turno_atual = 1 - self.turno_atual

        # Retorna: 0 = agente1 vence, 1 = agente2 vence, -1 = empate
        if self.placar[0] > self.placar[1]:
            return 0
        if self.placar[1] > self.placar[0]:
            return 1
        return -1


# ---------------------------------------------------------------------------
# Cálculo de intervalo de confiança (95%) via t-distribuição aproximada
# ---------------------------------------------------------------------------
def intervalo_confianca_95(n, p):
    """Wilson score interval — mais robusto que o normal para proporções."""
    z = 1.96
    denominador = 1 + z**2 / n
    centro = (p + z**2 / (2 * n)) / denominador
    margem = (z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2))) / denominador
    return max(0, centro - margem), min(1, centro + margem)


def desvio_padrao_proporcao(n, p):
    return math.sqrt(p * (1 - p) / n)


# ---------------------------------------------------------------------------
# Executa um cenário e coleta estatísticas detalhadas
# ---------------------------------------------------------------------------
def simular_cenario(tipo_a, tipo_b, n_partidas=1000, n_pares=8):
    vitorias = [0, 0, 0]   # a, b, empate
    turnos_totais = 0
    pares_memoria_a = 0
    pares_acaso_a = 0

    def criar_agente(tipo):
        if tipo == "aleatorio":
            return AgenteAleatorio()
        return AgenteComMemoria(nivel=tipo)

    for _ in range(n_partidas):
        a1 = criar_agente(tipo_a)
        a2 = criar_agente(tipo_b)
        jogo = JogoMemoria(a1, a2, n_pares=n_pares)
        resultado = jogo.jogar()

        if resultado == -1:
            vitorias[2] += 1
        else:
            vitorias[resultado] += 1

        turnos_totais += jogo.turnos_jogados

        if hasattr(a1, 'pares_por_memoria'):
            pares_memoria_a += a1.pares_por_memoria
            pares_acaso_a   += a1.pares_por_acaso

    p_vitoria_a = vitorias[0] / n_partidas
    ic_low, ic_high = intervalo_confianca_95(n_partidas, p_vitoria_a)
    dp = desvio_padrao_proporcao(n_partidas, p_vitoria_a)

    return {
        "tipo_a": tipo_a,
        "tipo_b": tipo_b,
        "n_partidas": n_partidas,
        "n_pares": n_pares,
        "vitorias_a": vitorias[0],
        "vitorias_b": vitorias[1],
        "empates": vitorias[2],
        "taxa_vitoria_a": round(p_vitoria_a * 100, 1),
        "ic_95_low": round(ic_low * 100, 1),
        "ic_95_high": round(ic_high * 100, 1),
        "desvio_padrao_pct": round(dp * 100, 2),
        "turnos_medios": round(turnos_totais / n_partidas, 1),
        "pares_por_memoria_a": pares_memoria_a,
        "pares_por_acaso_a": pares_acaso_a,
    }


# ---------------------------------------------------------------------------
# Exibe resultados formatados
# ---------------------------------------------------------------------------
def imprimir_resultado(r, detalhado=True):
    a = r["tipo_a"].upper()
    b = r["tipo_b"].upper()
    print(f"  {a:>10} vs {b:<10} | "
          f"Vit: {r['vitorias_a']:>4} x {r['vitorias_b']:<4} | "
          f"Emp: {r['empates']:>3} | "
          f"Taxa A: {r['taxa_vitoria_a']:>5.1f}% "
          f"[IC95: {r['ic_95_low']:.1f}%–{r['ic_95_high']:.1f}%] | "
          f"Turnos: {r['turnos_medios']:.1f}")
    if detalhado and r["pares_por_memoria_a"] + r["pares_por_acaso_a"] > 0:
        total = r["pares_por_memoria_a"] + r["pares_por_acaso_a"]
        pct_mem = r["pares_por_memoria_a"] / total * 100 if total > 0 else 0
        print(f"              Pares (A): {r['pares_por_memoria_a']} por memória "
              f"({pct_mem:.1f}%) | {r['pares_por_acaso_a']} por acaso")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    N = 1000   # partidas por cenário
    P = 8      # pares no tabuleiro (4×4 = 16 cartas)

    print("=" * 80)
    print(f"  SIMULAÇÃO — Memory Agents TCC  |  {N} partidas/cenário  |  {P*2} cartas (4×4)")
    print("=" * 80)

    # ── Bloco 1: Todos vs Aleatório (validação da escala de dificuldade) ──
    print("\n[1] AGENTE HEURÍSTICO vs ALEATÓRIO  (H1 e H2)")
    print("-" * 80)
    for nivel in ["facil", "medio", "dificil"]:
        r = simular_cenario(nivel, "aleatorio", N, P)
        imprimir_resultado(r)

    # ── Bloco 2: Confrontos cruzados entre níveis ──
    print("\n[2] CONFRONTOS ENTRE NÍVEIS  (H2)")
    print("-" * 80)
    pares_cruzados = [
        ("dificil", "medio"),
        ("dificil", "facil"),
        ("medio",   "facil"),
    ]
    for a, b in pares_cruzados:
        r = simular_cenario(a, b, N, P)
        imprimir_resultado(r)

    # ── Bloco 3: Confrontos simétricos (diagnóstico de equilíbrio) ──
    print("\n[3] CONFRONTOS SIMÉTRICOS  (equilíbrio interno dos níveis)")
    print("-" * 80)
    for nivel in ["aleatorio", "facil", "medio", "dificil"]:
        r = simular_cenario(nivel, nivel, N, P)
        imprimir_resultado(r, detalhado=False)

    # ── Bloco 4: Variação de tamanho de tabuleiro ──
    print("\n[4] EFEITO DO TAMANHO DO TABULEIRO  (Médio vs Aleatório)")
    print("-" * 80)
    for n_pares in [6, 8, 10]:
        r = simular_cenario("medio", "aleatorio", N, n_pares)
        print(f"  {n_pares*2:>2} cartas ({n_pares} pares) | "
              f"Taxa A: {r['taxa_vitoria_a']:>5.1f}% "
              f"[IC95: {r['ic_95_low']:.1f}%–{r['ic_95_high']:.1f}%] | "
              f"Turnos: {r['turnos_medios']:.1f}")

    print("\n" + "=" * 80)
    print("  Simulação concluída.")
    print("=" * 80)
