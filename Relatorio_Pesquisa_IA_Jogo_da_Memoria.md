# Relatório de Pesquisa: Fundamentação Teórica para o Agente de IA do Jogo da Memória

**Referente à Proposta de TCC:** *Plataforma Web para Geração de Jogos da Memória com Adversários de IA*
**Aluno:** Maurice Golin Soares dos Santos | **Orientadora:** Helyane Bronoski Borges

---

## 1. Objetivo deste relatório

Este documento reúne a pesquisa teórica que estava faltando entre a proposta original e a fase de implementação. O foco não é mais "como construir o site", mas **como fundamentar cientificamente o comportamento do agente de IA adversário**: quais abordagens de IA existem para esse tipo de jogo, como a memória humana realmente se comporta (para que o agente seja "humano" e não apenas fraco), e como transformar isso em parâmetros concretos de dificuldade dentro do sistema.

O relatório está organizado em quatro blocos:
1. Como a memória humana funciona no contexto do Jogo da Memória (base psicológica);
2. Abordagens de IA já usadas para adversários em jogos, com comparação entre elas;
3. Como a literatura de "Dynamic Difficulty Adjustment" (DDA) trata o ajuste de dificuldade — e como isso se aplica ao seu caso;
4. Uma proposta concreta de níveis de dificuldade e parâmetros, ligando a teoria psicológica às arquiteturas de IA.

---

## 2. Limites da memória humana aplicados ao Jogo da Memória

### 2.1 Quantas cartas um humano "concentrado" consegue guardar?

A pergunta "quantas cartas uma pessoa lê e guarda normalmente concentrada" tem resposta direta na literatura de memória de trabalho (*working memory*):

- **Miller (1956)**, no clássico "The Magical Number Seven, Plus or Minus Two", propôs que a memória imediata humana comporta cerca de **7 ± 2 "pedaços" (chunks)** de informação. Esse número é frequentemente citado, mas o próprio Miller o tratou mais como estimativa do que como limite rígido.
- **Cowan (2001, 2010)** revisou essa ideia e mostrou, com um conjunto amplo de experimentos (visuais, verbais, espaciais), que quando **não é possível agrupar (chunking)** os itens — que é exatamente o caso de cartas com imagens não relacionadas em um Jogo da Memória — a capacidade real do foco de atenção fica em torno de **4 ± 1 itens**, não 7.
- Um estudo mais recente (Morra, Patella e Muscella, 2024) comparando diretamente os dois modelos concluiu que a diferença entre "4" e "7" depende do tempo de apresentação e da possibilidade de recodificação: com exposição breve e itens não agrupáveis (como cartas viradas rapidamente), o número efetivo tende para o modelo de Cowan, próximo de 4.

**Implicação prática para a demonstração inicial do site:** ao mostrar as cartas brevemente no início da partida, é razoável esperar que um jogador humano "concentrado" retenha de forma confiável **cerca de 3 a 5 posições/pares**, não o tabuleiro inteiro. Isso também dá uma justificativa teórica para limitar a "memória perfeita" do próprio agente de IA no nível mais fácil.

Vale complementar com um dado mais aplicado: um site de jogo da memória para adultos (BrainDrop, 2026) recomenda faixas de tamanho de tabuleiro coerentes com isso: 6–8 pares para iniciantes/crianças, 10–12 pares como "ponto ideal" para adultos (exige esforço real de memória sem ser exaustivo) e 16–20 pares como desafio para jogadores experientes — ou seja, mesmo o design comercial já assume implicitamente que a capacidade de memória de trabalho é limitada e escala a dificuldade pelo tamanho do tabuleiro, não só pelo comportamento do oponente.

### 2.2 Em quanto tempo/quantas jogadas um humano esquece uma carta virada?

Aqui existem duas forças diferentes que causam o esquecimento, e a literatura mostra que **as duas importam**, não apenas o tempo:

**(a) Decaimento pelo tempo (decay):**
O experimento clássico de **Peterson e Peterson (1959)** mediu a retenção de itens simples sem permitir repetição mental (rehearsal): a lembrança caiu de cerca de **80% de acerto em 3 segundos para menos de 10% em 18 segundos**. Esse é o dado quantitativo mais citado sobre "quão rápido uma informação não repetida desaparece da memória de curto prazo".

**(b) Interferência por novas informações (interference):**
**Keppel e Underwood (1962)** mostraram que boa parte daquele esquecimento não era só o tempo passando, mas sim a **interferência de tentativas anteriores** — ou seja, ver informações novas (outras cartas sendo viradas) atrapalha a lembrança da carta antiga mais do que o simples relógio correndo. Revisões mais recentes (Ricker, Vergauwe e Cowan, 2016) confirmam que **decaimento por tempo e interferência coexistem**: cada jogada do adversário (ou do próprio jogador) que revela novas cartas funciona como um "distrator" que acelera o esquecimento da carta vista anteriormente.

Isso é diretamente relevante para o seu jogo: **o esquecimento de uma carta não deveria depender só de "quantos segundos se passaram", mas principalmente de "quantas cartas novas foram viradas desde então"** (interferência), com o tempo puro como fator secundário.

Um artigo aplicado sobre o próprio Jogo da Memória (BrainDrop, 2026) descreve dois efeitos que reforçam esse ponto e que podem ser usados diretamente como regras de projeto do agente:
- **Efeito de posição serial:** cartas vistas no início (primazia) e mais recentemente (recência) da sequência de jogadas são lembradas melhor do que cartas vistas no meio da partida.
- **Efeito de interferência:** cartas visualmente parecidas entre si são mais difíceis de diferenciar na memória — algo a considerar se o professor enviar imagens semelhantes.

### 2.3 O modelo matemático clássico de esquecimento (Curva de Ebbinghaus)

A base de praticamente todos os modelos computacionais de esquecimento é a **Curva do Esquecimento de Ebbinghaus (1885)**: a retenção de memória decai de forma **exponencial** com o tempo na ausência de reforço, sendo tipicamente descrita como:

```
R(t) = e^(-t/S)
```

onde `R` é a probabilidade de lembrar, `t` é o tempo (ou, em adaptações mais recentes, o número de eventos/interferências) e `S` é a "força" da memória daquele item específico. Trabalhos recentes de modelagem cognitiva e de IA (ex.: modelos de repetição espaçada, e até arquiteturas de memória para agentes de IA como o "FadeMem", 2026) usam variações diretas dessa fórmula, muitas vezes combinando um termo de decaimento por tempo com um termo de "importância" do item — o equivalente, no seu caso, poderia ser dar mais peso a cartas vistas mais vezes.

**Tradução prática para o agente:** ao invés de uma taxa de esquecimento fixa e arbitrária, você tem agora respaldo teórico para implementar algo como:

```
P(agente lembra da carta) = e^(-k · jogadas_desde_que_foi_vista)
```

com `k` (a taxa de decaimento) sendo o principal parâmetro ajustável por nível de dificuldade — quanto maior `k`, mais rápido o agente "esquece", simulando um jogador humano mais fraco.

---

## 3. Abordagens de IA para adversários — comparação

A proposta já identifica corretamente a dicotomia entre agentes "cegos" (sem observar o jogo) e "observadores" (que acumulam informação). Pesquisando a literatura de IA para jogos, é possível organizar as abordagens realistas para o seu caso em quatro famílias:

### 3.1 Heurística baseada em regras com esquecimento probabilístico

É a abordagem descrita por **Millington e Funge (2009)**, já citada na sua proposta: o comportamento "falho" do oponente é simulado por **taxas de esquecimento fixas definidas por regras**, sem aprendizado real. Na prática de jogos comerciais de memória, esse é o modelo mais comum: existem inclusive implementações abertas simples desse tipo (ex.: repositórios como *ai-memory-game-js* e *AI-Memory-Game-using-Knowledge-Base*), em que o agente guarda um "banco de dados" das cartas já vistas e decide com base em regras diretas (às vezes até guardando duplicatas de forma intencionalmente imperfeita, simulando confusão).

- **Vantagens:** simples de implementar, fácil de calibrar em níveis de dificuldade explícitos (basta variar a probabilidade de "lembrar"), comportamento previsível e depurável.
- **Limitações:** não é "aprendido"; o comportamento tende a parecer mecânico se os parâmetros não forem bem calibrados com dados reais de memória humana (por isso a Seção 2 deste relatório é importante).

### 3.2 Redes Neurais Artificiais (ex.: Multilayer Perceptron)

Sua proposta já cita **Haykin (2001)** como referência de Redes Neurais. Uma MLP pode ser usada não para "jogar perfeitamente", mas para **prever a probabilidade de o agente lembrar de uma carta**, combinando como entrada tanto a memória estática (posições vistas) quanto a dinâmica (padrão recente de jogadas) — exatamente a ideia já descrita na sua introdução. Isso a diferencia da abordagem puramente heurística porque os pesos podem ser ajustados a partir de dados simulados (ex.: rodadas geradas no ambiente Pygame da Etapa 3) em vez de regras escritas à mão.

- **Vantagens:** pode capturar padrões mais sutis (ex.: relação entre posição no tabuleiro e chance de esquecimento, efeito de posição serial) do que uma regra simples.
- **Limitações:** precisa de dados de treinamento (mesmo que sintéticos), maior esforço de engenharia e validação, risco de resultado "caixa-preta" difícil de justificar teoricamente no TCC se não for bem documentado.

### 3.3 Aprendizado por Reforço (Q-learning, DQN, PPO)

Há aplicações diretas e bem documentadas de aprendizado por reforço em jogos de cartas com informação imperfeita — categoria à qual o Jogo da Memória pertence, já que nem o agente nem o jogador enxergam todas as cartas. Trabalhos recentes comparam Q-learning, DQN e PPO em jogos como Dhumbal (Malla, 2025) e Big 2 (Patwa, 2026), mostrando que métodos baseados em política (PPO) tendem a superar métodos baseados em valor (Q-learning/DQN) em ambientes de informação imperfeita, mas com maior custo computacional de treinamento.

Um achado particularmente relevante é a linha de pesquisa sobre **"imperfect recall" (memória imperfeita) em teoria dos jogos** (Kovařík et al., 2024; trabalhos relacionados de Conitzer): esses estudos defendem que, em muitos casos, **é desejável projetar deliberadamente um agente de IA para esquecer**, e que esse esquecimento planejado é, na verdade, **mais fácil de modelar formalmente do que o esquecimento humano real** — o que reforça diretamente a ideia central da sua proposta de comparar agentes "de memória cheia" com agentes de memória limitada.

Existe até um exemplo direto de rede neural aplicada especificamente ao jogo *Concentration* (o mesmo Jogo da Memória): um estudo sobre redes neurais de pico (*spiking neural networks*) treinadas por reforço para aprender a jogar Concentration a partir de recompensas, encontrando pares com o menor número possível de jogadas. Embora a arquitetura (SNN) seja mais avançada do que o escopo provável do seu TCC, o experimento confirma que **o Jogo da Memória já foi tratado como ambiente de teste formal de aprendizado por reforço**, o que fortalece a justificativa acadêmica do seu projeto.

- **Vantagens:** capaz de "descobrir" estratégias sem regras escritas à mão; se combinado com limitação de observação (o agente literalmente não recebe todas as cartas na entrada), simula de forma mais natural um jogador com memória imperfeita.
- **Limitações:** por padrão, RL tende a convergir para o **jogo ótimo**, não para um jogo "humano" — por isso a memória limitada precisa ser imposta na própria representação do estado (o agente não pode "ver" tudo), e não apenas esperada como resultado do treinamento. Exige ambiente de simulação robusto (o que já está previsto na sua Etapa 3) e mais tempo de desenvolvimento.

### 3.4 Métodos de busca (Minimax/MCTS) — por que são menos adequados aqui

Métodos como Minimax e Monte Carlo Tree Search são amplamente usados em jogos como Reversi/Otelo e jogos de tabuleiro com informação completa. Contudo, a literatura sobre **jogos de informação imperfeita** mostra que esses métodos precisam de adaptações (como ISMCTS — Information Set MCTS) para lidar com estados ocultos, adicionando complexidade sem necessariamente representar melhor o comportamento "humano" desejado no seu TCC. Essa família é mencionada aqui principalmente para justificar, no texto do trabalho, **por que ela foi descartada** em favor das três abordagens acima.

### 3.5 Quadro-resumo comparativo

| Abordagem | Tipo de memória simulada | Complexidade de implementação | Facilidade de calibrar dificuldade | Aderência ao objetivo "simular humano" |
|---|---|---|---|---|
| Heurística com esquecimento probabilístico | Explícita (lista de cartas vistas + probabilidade) | Baixa | Alta (parâmetro direto) | Média — depende de bons parâmetros psicológicos |
| MLP (rede neural supervisionada) | Combinação de memória estática e dinâmica | Média-alta | Média (requer re-treino ou ajuste de entrada) | Alta, se treinada com dados calibrados pela Seção 2 |
| Aprendizado por Reforço (Q-learning/DQN/PPO) | Aprendida via observação parcial do estado | Alta | Média (via reward shaping e limitação de observação) | Alta, mas tende ao jogo ótimo se não for restringida |
| Busca (Minimax/MCTS/ISMCTS) | Não modela esquecimento diretamente | Alta (para info. imperfeita) | Baixa neste contexto | Baixa — foco em otimalidade, não em falhas humanas |

---

## 4. Ajuste de Dificuldade (Dynamic Difficulty Adjustment — DDA)

A sua pergunta "talvez estabeleça um nível de dificuldade com base na IA?" tem uma área de pesquisa dedicada a ela: **Dynamic Difficulty Adjustment (DDA)**. A revisão de Zohaib et al. (2018) resume o conceito: o objetivo do DDA é ajustar automaticamente o desafio de um jogo à habilidade do jogador em tempo real, para evitar que ele fique entediado (jogo fácil demais) ou frustrado (jogo difícil demais) — ideia ligada ao conceito de "flow" (fluxo).

Duas linhas de implementação aparecem com frequência na literatura e são diretamente aplicáveis ao seu caso:

1. **DDA baseado em Redes Neurais Artificiais**: a rede ajusta parâmetros do oponente (aqui, a taxa de esquecimento e a capacidade de memória) com base no desempenho do jogador, sem precisar reprocessar buscas custosas durante a partida.
2. **DDA baseado em busca (MCTS/UCT)**: mais preciso, mas computacionalmente mais caro — provavelmente desnecessário para um jogo do porte do Jogo da Memória.

Outra técnica citada na literatura (*dynamic scripting*) ajusta pesos de regras comportamentais com base no sucesso ou fracasso recente, o que se encaixa muito bem com a abordagem heurística da Seção 3.1: cada vitória/derrota do jogador incrementa ou reduz a probabilidade de esquecimento do agente.

**Aplicação direta ao seu TCC:** ao invés de apenas 3 níveis fixos ("fácil/médio/difícil"), você pode justificar academicamente um **modo adaptativo**, em que os parâmetros de memória do agente (capacidade e taxa de esquecimento, conforme Seção 2) sobem ou descem automaticamente conforme a taxa de acerto do jogador humano na partida atual — e isso pode inclusive virar um dos "algoritmos a comparar" da sua Etapa 4, ao lado dos agentes de dificuldade fixa.

---

## 5. Proposta de Níveis de Dificuldade (ligando teoria e implementação)

Combinando as Seções 2, 3 e 4, uma proposta concreta e defensável teoricamente para os níveis de dificuldade do agente:

| Nível | Capacidade de memória (baseado em Cowan/Miller) | Taxa de esquecimento (baseada em Ebbinghaus/Peterson-Peterson) | Arquitetura sugerida |
|---|---|---|---|
| **Fácil** | Retém poucas cartas por vez (ex.: 1–2), abaixo do limite humano médio | Decaimento rápido: `k` alto — esquece após poucas jogadas interpostas | Heurística com regras fixas (Seção 3.1) |
| **Médio** | Próximo do limite realista de um humano concentrado (~4 cartas, conforme Cowan) | Decaimento moderado, dependente de interferência (nº de jogadas desde a última visualização, não só tempo) | Heurística calibrada ou MLP simples |
| **Difícil** | Acima do limite humano típico (memória quase completa do tabuleiro) | Decaimento baixo/quase nulo | MLP treinada ou agente de RL com observação ampla |
| **Adaptativo** (opcional, mas academicamente rico) | Ajustado em tempo real | Ajustado em tempo real via DDA (Seção 4) | Heurística com parâmetros ajustados dinamicamente pelo desempenho do jogador |

Esse desenho permite que sua Etapa 4 ("Implementação e Comparação dos Agentes") tenha uma base experimental clara: comparar não só "quem ganha mais", mas **quão próximo cada arquitetura chega dos números reais de memória humana levantados na Seção 2** — que é exatamente o critério de "simulação humana" que você já definia como objetivo específico na proposta original.

---

## 6. Referências

COWAN, N. The magical number 4 in short-term memory: A reconsideration of mental storage capacity. **Behavioral and Brain Sciences**, v. 24, n. 1, p. 87-114, 2001.

COWAN, N. The Magical Mystery Four: How Is Working Memory Capacity Limited, and Why? **Current Directions in Psychological Science**, v. 19, n. 1, p. 51-57, 2010.

MORRA, S.; PATELLA, P.; MUSCELLA, L. Modelling Working Memory Capacity: Is the Magical Number Four, Seven, or Does it Depend on What You Are Counting? **Journal of Cognition**, 2024. DOI: 10.5334/joc.387.

MILLER, G. A. The magical number seven, plus or minus two: Some limits on our capacity for processing information. **Psychological Review**, v. 63, p. 81-97, 1956.

PETERSON, L. R.; PETERSON, M. J. Short-term retention of individual verbal items. **Journal of Experimental Psychology**, 1959. (Resumo consultado via SimplyPsychology, 2026).

KEPPEL, G.; UNDERWOOD, B. J. Proactive inhibition in short-term retention of single items. 1962. (Citado em RICKER; VERGAUWE; COWAN, 2016).

RICKER, T. J.; VERGAUWE, E.; COWAN, N. Decay theory of immediate memory: From Brown (1958) to today. **Quarterly Journal of Experimental Psychology**, 2016.

BRAINDROP. Free Memory Card Game for Seniors & Adults — guia de tamanhos de tabuleiro e efeitos de posição serial/interferência. Disponível em: https://memory.braindrop.games/. Acesso em: 2026.

MILLINGTON, I.; FUNGE, J. **Artificial Intelligence for Games**. 2. ed. Boca Raton: CRC Press, 2009.

HAYKIN, S. **Redes Neurais: Princípios e Prática**. 2. ed. Porto Alegre: Bookman, 2001.

RUSSELL, S.; NORVIG, P. **Inteligência Artificial: Uma Abordagem Moderna**. 4. ed. Rio de Janeiro: GEN LTC, 2021.

MALLA, S. R. AI Agents for the Dhumbal Card Game: A Comparative Study. **arXiv:2510.11736**, 2025.

PATWA, A. Self-Play Reinforcement Learning under Imperfect Information in Big 2. **arXiv:2605.28863**, 2026.

KOVAŘÍK, V. et al. Imperfect-Recall Games: Equilibrium Concepts and Their Complexity. **Proceedings of IJCAI-24**, 2024.

Memory-enriched computation and learning in spiking neural networks through Hebbian plasticity (aplicação ao jogo Concentration). **arXiv:2205.11276**, 2022.

ZOHAIB, M. Dynamic Difficulty Adjustment (DDA) in Computer Games: A Review. **Advances in Human-Computer Interaction**, Wiley, 2018.

Dynamic difficulty adjustment of game AI for video game Dead-End (abordagem via Rede Neural Artificial). **IEEE Conference Publication**, 2010.

Dynamic difficulty adjustment realization based on adaptive neuro-controlled game opponent (abordagem via MCTS/UCT). **IEEE Conference Publication**, 2010.

Personalized Dynamic Difficulty Adjustment — Imitation Learning Meets Reinforcement Learning. **arXiv:2408.06818**, 2024.

ZWICK, U.; PATERSON, M. S. The memory game. **Theoretical Computer Science / ScienceDirect**, 1993. (Análise da estratégia ótima assumindo memória perfeita — útil como "teto teórico" de comparação para os agentes com memória limitada).

*Observação: as referências acima seguem o padrão já usado na sua proposta original. Recomendo confirmar o ano exato e os dados completos de cada uma diretamente nas fontes (DOIs/links) antes de inserir no texto final do TCC, e obter os PDFs completos via portal de periódicos da UTFPR sempre que possível, em vez dos resumos aqui usados.*
