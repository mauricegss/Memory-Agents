# Fundamentação Teórica e Análise Comparativa de Abordagens de Inteligência Artificial para Simulação do Comportamento Humano no Jogo da Memória

**Projeto:** Memory Agents — Plataforma Web Educacional de Jogo da Memória com Adversários de IA  
**Aluno:** Maurice Golin Soares dos Santos | **Orientadora:** Helyane Bronoski Borges

---

## 1. Delimitação do problema e questão de pesquisa

O *Memory Agents* é uma plataforma web educacional em que docentes criam jogos da memória e estudantes enfrentam um adversário computacional. O objetivo central deste trabalho não é construir o agente mais forte possível: um oponente com acesso irrestrito ao estado do tabuleiro teria memória perfeita e, por isso, representaria um adversário artificialmente invencível e pouco relevante do ponto de vista pedagógico. O desafio de pesquisa é outro — e mais rico: **identificar qual paradigma de inteligência artificial produz um agente cujo comportamento se aproxima mais do comportamento humano observado na literatura cognitiva**, tornando a partida desafiante, justa e educacionalmente significativa.

Assim, define-se a seguinte **questão de pesquisa central**:

> *Em que medida as diferentes abordagens de IA disponíveis — heurística, supervisionada e por reforço — são capazes de simular o comportamento cognitivo humano no jogo da memória, considerando limitações de capacidade, esquecimento e erro de recuperação?*

### Objetivo geral

Comparar paradigmas de inteligência artificial segundo critérios cognitivamente motivados e selecionar, implementar e avaliar o agente mais adequado como adversário em uma plataforma educacional de jogo da memória.

### Objetivos específicos

1. Caracterizar o comportamento cognitivo humano no jogo da memória com base na literatura de memória de trabalho e esquecimento.
2. Analisar criticamente cinco paradigmas de IA segundo critérios de aderência ao comportamento humano.
3. Propor e implementar o agente mais adequado como adversário em plataforma educacional.
4. Comparar experimentalmente o agente proposto com os demais em simulação controlada.
5. Avaliar a percepção de desafio e naturalidade pelos usuários finais.

---

## 2. O comportamento humano no jogo da memória

### 2.1 Capacidade da memória de trabalho

A pergunta fundamental para calibrar qualquer agente adversário é: **quantas cartas um jogador humano concentrado consegue reter simultaneamente?**

A resposta mais citada na literatura parte de **Miller (1956)**, que propôs no clássico artigo *"The Magical Number Seven, Plus or Minus Two"* que a memória imediata comporta aproximadamente **7 ± 2 unidades de informação (*chunks*)**. Contudo, o próprio Miller reconhecia que esse número dependia criticamente da possibilidade de *chunking* — agrupamento de informações em unidades maiores de sentido.

**Cowan (2001, 2010)** revisou essa estimativa com uma série de experimentos controlando o *chunking*. Quando os itens são semanticamente não relacionados — condição que se aproxima da situação de cartas com imagens diversas em um jogo da memória — o foco de atenção se restringe a aproximadamente **4 ± 1 itens**. Em uma revisão direta dos dois modelos, **Morra, Patella e Muscella (2024)** confirmam que a diferença entre "sete" e "quatro" se reduz à possibilidade de recodificação: com estímulos não agrupáveis expostos brevemente, o modelo de Cowan (~4) descreve melhor o desempenho.

> **Implicação de projeto:** a capacidade de memória do agente no nível médio deve ser calibrada próxima de 4 posições, não de 16 (o tabuleiro inteiro). Um agente com memória perfeita viola sistematicamente essa premissa cognitiva.

### 2.2 Esquecimento: decaimento e interferência

O esquecimento não é um fenômeno unitário. A literatura identifica dois mecanismos que coexistem e interagem:

**(a) Decaimento temporal:** **Peterson e Peterson (1959)** mediram a retenção de itens verbais simples sem permitir repetição mental. A retenção caiu de ~80% em 3 segundos para menos de 10% em 18 segundos. Esse é o dado quantitativo mais robusto sobre a velocidade de desaparecimento de uma informação não ensaiada da memória de curto prazo.

**(b) Interferência retroativa:** **Keppel e Underwood (1962)** mostraram que grande parte do esquecimento não é causada apenas pelo tempo, mas pela **competição de novas informações com traços já retidos**. Revisões contemporâneas (**Ricker, Vergauwe e Cowan, 2016**) confirmam que decaimento e interferência coexistem: cada nova carta revelada funciona como um distrator que reduz a acessibilidade de posições previamente vistas.

No contexto do jogo da memória, isso significa que o esquecimento do agente deve depender **principalmente do número de cartas reveladas desde a última observação** (interferência), e não exclusivamente do tempo decorrido.

### 2.3 A curva de Ebbinghaus como modelo operacional

O modelo matemático clássico para representar o esquecimento é a **Curva do Esquecimento de Ebbinghaus (1885)**, que descreve o decaimento como função exponencial:

```
R(t) = e^(−t/S)
```

onde `R` é a probabilidade de recuperação, `t` é o tempo (ou, em adaptações modernas, o número de eventos interpostos) e `S` é a força de memória do item. Modelos contemporâneos de espaçamento e repetição (SRS, Anki) e arquiteturas de memória para agentes de IA usam variações diretas dessa fórmula.

A tradução operacional para o agente adversário é:

```
força_nova = força_anterior × (1 − taxa_de_decaimento)
```

onde a taxa de decaimento é aplicada a **cada nova carta revelada por qualquer jogador**, modelando interferência. Quando a força cai abaixo de um limiar, o item é removido da memória do agente.

### 2.4 Efeitos de posição serial

A literatura de memória registra dois efeitos robustos de posição serial que também aparecem no contexto de jogos:

- **Efeito de primazia:** itens apresentados no início de uma sequência tendem a ser melhor retidos, pois há mais oportunidade de ensaio mental.
- **Efeito de recência:** os itens mais recentemente vistos permanecem mais acessíveis na memória de trabalho.

No jogo da memória, cartas reveladas recentemente ou no início da partida são lembradas com mais facilidade do que aquelas vistas no meio da partida — informação relevante para ponderar a força de memória do agente.

---

## 3. Paradigmas de IA: análise crítica para simulação do comportamento humano

Esta seção apresenta cinco paradigmas de IA avaliados segundo um critério unificador: **o quanto cada abordagem é capaz de reproduzir as limitações cognitivas humanas descritas na Seção 2**, em vez de maximizar desempenho.

### 3.1 Agente aleatório (*baseline*)

O agente aleatório seleciona duas posições uniformemente ao acaso a cada turno, sem qualquer forma de memória ou aprendizado. É a linha de base indispensável: qualquer agente que se propõe a simular comportamento humano deve superar o desempenho aleatório para ser relevante — mas não deve superá-lo de forma tão ampla a ponto de ser percebido como "injusto".

**Análise quanto à humanização:** um humano não joga aleatoriamente mesmo no primeiro turno. Ele acumula informação progressivamente. O agente aleatório subestima a capacidade humana e serve apenas como piso de referência.

### 3.2 Agente heurístico com memória perfeita

Esta abordagem armazena todas as posições observadas e as recupera com 100% de precisão. Em teoria dos jogos, representa o caso de memória completa analisado por **Zwick e Paterson (1993)**, que demonstraram a estratégia ótima para esse cenário. Implementações diretas existem em diversos repositórios de código aberto.

**Análise quanto à humanização:** o agente com memória perfeita viola sistematicamente as premissas da Seção 2. Ele nunca esquece, não comete erros de recuperação e acerta todo par que já observou. Um estudante jogando contra este agente enfrentará um adversário que se comporta como um computador, não como um humano com falhas cognitivas naturais — o que compromete a experiência educacional e a percepção de justiça.

**Conclusão:** inadequado como adversário educacional primário; útil como **teto teórico de referência** e linha de base superior.

### 3.3 Agente heurístico com memória limitada e esquecimento (*proposta principal*)

Esta abordagem, descrita por **Millington e Funge (2009)** para jogos em geral, adapta a heurística de regras para incorporar as limitações cognitivas da Seção 2. O agente mantém um mapa restrito de posições observadas, aplica decaimento a cada nova observação (interferência), e comete erros intencionais de recuperação.

A política de decisão em seis etapas:
1. Remover da memória cartas que já formaram pares (informação obsoleta).
2. Atualizar força e recência quando qualquer jogador revela uma carta.
3. Aplicar decaimento a todos os itens retidos e remover o menos recente se a capacidade for excedida.
4. Se uma carta já está aberta, buscar o par na memória; se não encontrar, explorar.
5. Se nenhuma carta está aberta, priorizar um par conhecido; caso contrário, explorar.
6. Com probabilidade `taxa_de_erro`, ignorar a melhor escolha e explorar — simulando erro de recuperação.

**Análise quanto à humanização:** é a única abordagem entre as avaliadas que implementa diretamente os três mecanismos cognitivos identificados na literatura — capacidade limitada, esquecimento por interferência e erro de recuperação. Os parâmetros são **explícitos, auditáveis e calibráveis** com base em evidências empíricas (Cowan, Peterson-Peterson, Ebbinghaus). O comportamento pode ser reproduzido exatamente por uma semente aleatória, o que é essencial para validade experimental.

**Limitação:** os parâmetros iniciais precisam de validação empírica. A hipótese de que os valores propostos produzem percepção adequada de dificuldade deve ser testada com usuários.

### 3.4 Aprendizado supervisionado: MLP e KNN

Redes neurais multicamadas (MLP) e K-Nearest Neighbors (KNN) podem ser treinados para **prever a probabilidade de um par de posições ser correto**, tomando como entrada o histórico de observações. **Haykin (2001)** e **Russell e Norvig (2021)** descrevem esses métodos no contexto geral de aprendizado de máquina; sua aplicação a jogos de cartas com informação imperfeita é documentada em trabalhos recentes (**Malla, 2025**).

**Análise quanto à humanização:**

O principal problema dessas abordagens no contexto específico deste projeto está na **representação do estado de entrada**. No protótipo atual, ambos os agentes recebem como entrada o par de índices de posição `(i, j)` — uma representação que não captura semântica de memória: o modelo não sabe quantas cartas foram vistas desde a posição `i`, nem com que força o agente retém essa informação. Portanto, o modelo aprende correlações de posição em dados sintéticos, não padrões cognitivos.

Uma implementação mais adequada exigiria como entrada: força atual de memória de cada posição, número de observações interpostas, e resultado das últimas tentativas. Nessa configuração, o MLP poderia estimar a probabilidade de recuperação com base em curvas próximas à de Ebbinghaus.

Adicionalmente, sem dados de jogadores reais, o treinamento ocorre sobre dados sintéticos gerados pelo próprio sistema — criando um ciclo circular: o modelo aprende padrões definidos pelo autor, não pela cognição humana.

**Conclusão:** abordagem válida como alternativa complementar e objeto de comparação experimental, mas não como agente principal dado que o comportamento emergente não é cognitivamente motivado de forma explícita.

### 3.5 Aprendizado por reforço: Q-Learning

O Q-Learning é um método de aprendizado por reforço sem modelo (*model-free*) em que um agente aprende uma função de valor de ação `Q(s, a)` por interação direta com o ambiente, maximizando recompensa acumulada (**Sutton e Barto, 2018**). Aplicações em jogos com informação imperfeita são bem documentadas — **Malla (2025)** compara Q-Learning, DQN e PPO em jogos de cartas, mostrando que métodos baseados em política (PPO) tendem a superar métodos baseados em valor em ambientes de observação parcial.

Um resultado particularmente relevante para este projeto é a pesquisa sobre *imperfect recall* em teoria dos jogos (**Kovařík et al., 2024**): esses estudos demonstram que **projetar deliberadamente um agente para esquecer** é, em muitos casos, **mais fácil de modelar formalmente do que reproduzir o esquecimento humano**. Isso reforça a ideia de que o esquecimento no agente heurístico proposto é uma decisão de projeto, não uma limitação acidental.

**Análise quanto à humanização:** o Q-Learning tende, por design, a convergir para a **política ótima** — o que, neste contexto, significa maximizar pares encontrados, aproximando-se da memória perfeita conforme o treinamento avança. Para simular comportamento humano falho, seria necessário: (a) restringir a observação do agente (ele não pode "ver" todo o tabuleiro), e (b) aplicar técnicas de *reward shaping* para penalizar comportamentos super-humanos. Sem essas restrições, o agente aprende a jogar bem, não a jogar humanamente.

A Q-table no protótipo atual é indexada por par de posições `(i, j)`, sem estado de memória — tornando a política dependente apenas da posição, não do contexto cognitivo.

**Conclusão:** abordagem válida como referência experimental avançada. Comparar o agente heurístico com o Q-Learning é mais informativo para o TCC do que substituí-lo, pois a comparação evidencia empiricamente a diferença entre maximizar desempenho e simular cognição.

### 3.6 Métodos de busca: Minimax e MCTS

Minimax e Monte Carlo Tree Search (MCTS) são técnicas de planejamento amplamente usadas em jogos com informação completa (xadrez, Go). Para jogos com informação imperfeita — categoria à qual o jogo da memória pertence, pois nenhum jogador conhece todas as cartas — é necessário adaptar esses métodos para trabalhar com conjuntos de informação (*information sets*), resultando em variantes como ISMCTS.

**Análise quanto à humanização:** esses métodos são otimizados para encontrar a **jogada de maior valor esperado**, não para reproduzir limitações cognitivas. Integrar esquecimento a uma busca Minimax requereria modificar a função de avaliação de estados, tornando a abordagem híbrida e de justificação mais complexa no contexto de um TCC orientado à simulação cognitiva.

**Conclusão:** não adequados para os objetivos deste trabalho. Mencionados para justificar sua exclusão explícita da análise experimental.

---

## 4. Critérios de humanização de agentes adversários

Para tornar a análise comparativa rigorosa, propõe-se um conjunto de **critérios formais de humanização** — propriedades que um agente deve exibir para ser considerado uma boa simulação de um jogador humano:

| Critério | Descrição | Base teórica |
|---|---|---|
| **Capacidade limitada** | O agente retém no máximo *C* posições simultaneamente | Cowan (2001): ~4 ± 1 itens |
| **Esquecimento por interferência** | Novas observações reduzem a força de itens retidos | Keppel e Underwood (1962); Ricker et al. (2016) |
| **Efeito de recência** | Itens mais recentes têm força de memória maior | Ebbinghaus (1885); efeito de recência serial |
| **Erro de recuperação** | O agente às vezes falha ao recuperar um item mesmo que o "saiba" | Peterson e Peterson (1959) |
| **Ausência de onisciência** | O agente não acessa cartas que não observou | Separação observação/estado oculto |
| **Configurabilidade** | Os parâmetros podem ser ajustados para níveis de dificuldade distintos | DDA: Zohaib (2018) |
| **Auditabilidade** | O comportamento pode ser explicado em termos de variáveis observáveis | Requisito pedagógico da plataforma |
| **Reprodutibilidade** | Dado uma semente aleatória, o comportamento é idêntico | Requisito de validade experimental |

---

## 5. Análise comparativa formal

A tabela a seguir avalia cada abordagem segundo os oito critérios propostos (✓ atende, ~ atende parcialmente, ✗ não atende):

| Critério | Aleatório | Mem. perfeita | **Heurístico c/ decay** | MLP/KNN | Q-Learning |
|---|:---:|:---:|:---:|:---:|:---:|
| Capacidade limitada | ✗ | ✗ | **✓** | ~ | ~ |
| Esquecimento por interferência | ✗ | ✗ | **✓** | ✗ | ✗ |
| Efeito de recência | ✗ | ✗ | **✓** | ✗ | ✗ |
| Erro de recuperação | ~ (acidental) | ✗ | **✓** (intencional) | ~ | ✗ |
| Ausência de onisciência | ✓ | ✗ | **✓** | ✓ | ~ |
| Configurabilidade | ✓ | ✗ | **✓** | ~ | ~ |
| Auditabilidade | ✓ | ✓ | **✓** | ✗ | ✗ |
| Reprodutibilidade | ✓ | ✓ | **✓** | ✓ | ✓ |
| **Total ✓** | **3** | **2** | **8** | **3–4** | **2–3** |

A análise evidencia que o **agente heurístico com decay cognitivo** é o único paradigma que atende simultaneamente a todos os critérios de humanização propostos. Os demais são válidos como referências experimentais e como objeto de comparação, mas não como solução principal para uma plataforma educacional que se propõe a simular cognição.

---

## 6. IA selecionada: agente heurístico com memória limitada e decay cognitivo

Com base na análise da Seção 5, o **agente heurístico com memória limitada e esquecimento parametrizável** é selecionado como adversário principal da plataforma. Sua implementação mantém um mapa `posição → {par_observado, recência, força}` exclusivamente para cartas já reveladas por qualquer jogador.

### 6.1 Parâmetros e níveis de dificuldade

| Nível | Capacidade (*C*) | Decaimento por observação (*d*) | Erro de recuperação (*e*) | Interpretação cognitiva |
|---|:---:|:---:|:---:|---|
| Fácil | 2 posições | 0,35 | 0,30 | Abaixo do limite humano mínimo; retenção e recuperação muito instáveis |
| Médio | 4 posições | 0,15 | 0,12 | Referência de Cowan (2001); retenção típica de um adulto concentrado |
| Difícil | 12 posições | 0,03 | 0,03 | Bem acima do limite humano; retenção alta, mas sem acesso oculto ao tabuleiro |

Os valores são **parâmetros iniciais**, não constantes psicológicas. A hipótese experimental (H2) é que desempenho e taxa de vitória diminuam monotonamente de difícil para fácil. Caso a simulação não confirme essa monotonia, os parâmetros devem ser recalibrados antes do experimento com participantes.

### 6.2 Modelo formal de esquecimento

A força de memória de uma posição *p* é atualizada a cada nova observação de **qualquer** carta, segundo:

```
força(p, t+1) = força(p, t) × (1 − d)
```

A probabilidade de recuperação bem-sucedida é diretamente proporcional à força. Um item é removido da memória quando sua força cai abaixo de um limiar mínimo ou quando a capacidade máxima *C* é excedida, priorizando o item de menor força.

O erro de recuperação é modelado como uma perturbação probabilística: com probabilidade *e*, o agente ignora a melhor decisão conhecida e explora aleatoriamente — mesmo quando o par correto está em memória.

---

## 7. Ajuste dinâmico de dificuldade (DDA)

**Dynamic Difficulty Adjustment** (DDA) modifica parâmetros do jogo em tempo de execução conforme o desempenho do jogador (**Zohaib, 2018**). No contexto deste projeto, dois modos são propostos:

**Modo estático:** níveis fixos (fácil/médio/difícil), conforme a Seção 6.1. Prioritário para o experimento, pois garante condições reprodutíveis.

**Modo adaptativo (extensão):** os parâmetros *d* e *e* são ajustados entre turnos com base em uma janela de desempenho recente do jogador. Se o estudante vence com ampla margem, *d* diminui (agente retém mais); se perde consistentemente, *d* aumenta (agente esquece mais). Este modo não modifica parâmetros durante uma jogada já iniciada, preservando a consistência interna da partida.

O modo adaptativo deve ser sinalizado na interface para não comprometer a transparência pedagógica. Em termos experimentais, pode constituir uma quarta condição de comparação após os testes com os três níveis fixos.

---

## 8. Plano de avaliação experimental

### 8.1 Avaliação por simulação

Para cada tamanho de tabuleiro (4×4, 4×5) e para cada agente e nível de dificuldade, executar no mínimo 100 partidas com sementes distintas. Registrar: taxa de vitória do agente, número médio de viradas, pares acertados por conhecimento versus por acaso, e duração média. Comparar todos os agentes entre si e reportar média, desvio-padrão e intervalo de confiança de 95%.

### 8.2 Avaliação com participantes

Aplicar sessão com o público-alvo, com consentimento e sem coleta de dados pessoais desnecessários. Controlar a ordem das condições para reduzir efeito de aprendizagem. Após cada partida, aplicar escala Likert de percepção de dificuldade (1 = muito fácil, 5 = muito difícil) e de naturalidade do comportamento da IA (1 = muito robótico, 5 = muito humano). Cruzar percepção subjetiva com métricas objetivas de simulação.

### 8.3 Hipóteses

- **H1:** O agente heurístico com decay supera o aleatório em pares acertados e taxa de vitória.
- **H2:** O nível difícil supera o médio, que supera o fácil, nas métricas de desempenho do agente.
- **H3:** O nível médio recebe maior avaliação de dificuldade adequada que os extremos.
- **H4:** O agente heurístico com decay recebe avaliação de naturalidade significativamente superior ao agente com memória perfeita.
- **H5:** O Q-Learning, sem restrição de observação, converge para desempenho próximo ao de memória perfeita, confirmando sua inadequação como simulador cognitivo neste contexto.

---

## 9. Ameaças à validade

**Validade interna:** os parâmetros de decay foram calibrados com base em literatura cognitiva, não em dados de jogadores reais. A extrapolação direta de resultados laboratoriais de memória para o contexto de um jogo pode introduzir desvios.

**Validade externa:** a amostra de participantes pode ser pequena e não representar a diversidade de faixas etárias e experiência com jogos. Resultados do nível médio podem não generalizar para públicos muito jovens ou muito experientes.

**Validade de constructo:** imagens semanticamente relacionadas entre si permitem *chunking*, reduzindo a validade da premissa de "4 itens sem agrupamento". Esse fator deve ser controlado pelo professor ao selecionar as cartas e deve ser relatado como limitação.

**Validade de conclusão:** o número mínimo de 100 partidas por condição deve ser suficiente para detectar diferenças de ±10% na taxa de vitória com α = 0,05 e poder de 0,80 — mas isso deve ser verificado com cálculo de tamanho de amostra antes do experimento.

---

## Referências

COWAN, N. The magical number 4 in short-term memory: a reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, v. 24, n. 1, p. 87–114, 2001. DOI: [10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922).

COWAN, N. The magical mystery four: how is working memory capacity limited, and why? *Current Directions in Psychological Science*, v. 19, n. 1, p. 51–57, 2010. DOI: [10.1177/0963721409359277](https://doi.org/10.1177/0963721409359277).

EBBINGHAUS, H. *Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie*. Leipzig: Duncker & Humblot, 1885.

HAYKIN, S. *Redes Neurais: Princípios e Prática*. 2. ed. Porto Alegre: Bookman, 2001.

KEPPEL, G.; UNDERWOOD, B. J. Proactive inhibition in short-term retention of single items. *Journal of Verbal Learning and Verbal Behavior*, v. 1, n. 3, p. 153–161, 1962. DOI: [10.1016/S0022-5371(62)80023-1](https://doi.org/10.1016/S0022-5371(62)80023-1).

KOVAŘÍK, V. et al. Imperfect-recall games: equilibrium concepts and their complexity. In: *Proceedings of the 33rd International Joint Conference on Artificial Intelligence (IJCAI-24)*, 2024.

MALLA, S. R. AI agents for the Dhumbal card game: a comparative study. *arXiv:2510.11736*, 2025.

MILLER, G. A. The magical number seven, plus or minus two: some limits on our capacity for processing information. *Psychological Review*, v. 63, n. 2, p. 81–97, 1956. DOI: [10.1037/h0043158](https://doi.org/10.1037/h0043158).

MILLINGTON, I.; FUNGE, J. *Artificial Intelligence for Games*. 2. ed. Boca Raton: CRC Press, 2009.

MORRA, S.; PATELLA, P.; MUSCELLA, L. Modelling working memory capacity: is the magical number four, seven, or does it depend on what you are counting? *Journal of Cognition*, 2024. DOI: [10.5334/joc.387](https://doi.org/10.5334/joc.387).

PETERSON, L. R.; PETERSON, M. J. Short-term retention of individual verbal items. *Journal of Experimental Psychology*, v. 58, n. 3, p. 193–198, 1959. DOI: [10.1037/h0049234](https://doi.org/10.1037/h0049234).

RICKER, T. J.; VERGAUWE, E.; COWAN, N. Decay theory of immediate memory: from Brown (1958) to today. *Quarterly Journal of Experimental Psychology*, v. 69, n. 10, p. 1969–1995, 2016. DOI: [10.1080/17470218.2014.914546](https://doi.org/10.1080/17470218.2014.914546).

RUSSELL, S.; NORVIG, P. *Inteligência Artificial: Uma Abordagem Moderna*. 4. ed. Rio de Janeiro: GEN LTC, 2021.

SUTTON, R. S.; BARTO, A. G. *Reinforcement Learning: An Introduction*. 2. ed. Cambridge: MIT Press, 2018.

ZOHAIB, M. Dynamic Difficulty Adjustment (DDA) in computer games: a review. *Advances in Human-Computer Interaction*, 2018, art. 5681652. DOI: [10.1155/2018/5681652](https://doi.org/10.1155/2018/5681652).

ZWICK, U.; PATERSON, M. S. The memory game. *Theoretical Computer Science*, v. 110, n. 1, p. 169–196, 1993. DOI: [10.1016/0304-3975(93)90355-W](https://doi.org/10.1016/0304-3975(93)90355-W).

## 1. Delimitação do problema

O *Memory Agents* é uma plataforma web educacional em que docentes criam jogos da memória e estudantes enfrentam um adversário computacional. O problema de pesquisa não é somente produzir um agente que vença: um oponente com acesso irrestrito ao estado do tabuleiro teria memória perfeita e, por isso, representaria uma dificuldade pouco transparente e potencialmente frustrante. O desafio é construir um agente competitivo, configurável e explicável, cuja limitação de memória possa ser relacionada a evidências da cognição humana.

Assim, define-se a seguinte questão de pesquisa: **em que medida um agente heurístico com capacidade e esquecimento parametrizáveis produz níveis de desafio distintos e adequados em um jogo da memória educacional?**

### Objetivo geral

Desenvolver e avaliar um agente adversário de IA, integrado a uma plataforma web de jogo da memória, que simule memória limitada e permita controlar a dificuldade de forma reprodutível.

### Objetivos específicos

1. Modelar o estado observável do jogo sem revelar ao agente cartas ainda fechadas.
2. Representar capacidade, recência, interferência e erro de recuperação da memória.
3. Implementar níveis fácil, médio e difícil por parâmetros explícitos.
4. Comparar o agente proposto com uma linha de base aleatória e, opcionalmente, com memória perfeita.
5. Avaliar desempenho, equilíbrio e experiência percebida pelos participantes.

## 2. Jogo da memória como ambiente de decisão

No jogo da memória (*Concentration*), as cartas permanecem ocultas e cada turno revela duas posições. O jogador precisa decidir entre explorar posições desconhecidas e recuperar informações de revelações anteriores. Portanto, o jogo combina observação parcial, memória e estratégia. Zwick e Paterson (1993) analisam formalmente o jogo no caso idealizado de memória perfeita; esse caso é útil aqui como teto teórico, mas não como modelo de um adversário humano.

Para o presente projeto, o estado interno do agente é restrito ao histórico de cartas reveladas. Em particular, a IA não recebe o identificador do par nem o conteúdo de cartas fechadas. Essa separação é essencial: reduzir apenas a taxa de acerto de um agente que enxerga o tabuleiro inteiro não simula memória humana; apenas introduz aleatoriedade sobre informação privilegiada.

## 3. Memória de trabalho, esquecimento e interferência

A memória de trabalho mantém informação temporariamente disponível para a tarefa atual. Miller (1956) popularizou a estimativa de sete mais ou menos dois *chunks*, mas a revisão de Cowan (2001) sustenta que, quando o agrupamento é controlado, o foco de atenção é limitado a aproximadamente quatro unidades. Imagens ou palavras sem relação prévia, reveladas uma a uma, aproximam-se mais dessa última condição do que de uma lista que permite agrupamento.

Esse resultado não deve ser convertido em uma alegação rígida de que toda pessoa recordará exatamente quatro cartas. Idade, familiaridade com os estímulos, tempo de exposição e estratégia modificam o desempenho. Para o projeto, ele fornece uma referência de calibração: quatro posições conhecidas é um ponto de partida defensável para a dificuldade média, que deve ser validado empiricamente com jogadores do público-alvo.

O esquecimento de curto prazo é explicado por mais de um mecanismo. A revisão de Ricker, Vergauwe e Cowan (2016) discute o decaimento temporal; a interferência ocorre quando novos itens competem com uma informação já retida. No jogo, cada revelação posterior pode reduzir a acessibilidade de uma posição previamente vista. Por isso, o modelo adotado diminui a força de cada lembrança quando uma nova carta é observada, em vez de depender exclusivamente de segundos transcorridos.

Uma forma operacional, deliberadamente simples e auditável, é:

`força_nova = força_anterior × (1 − taxa_de_decaimento)`

Uma lembrança pode ser removida quando falha uma amostragem probabilística baseada nessa força. A repetição de uma carta atualiza sua recência e sua força. O modelo não afirma reproduzir toda a memória humana; ele implementa hipóteses cognitivamente motivadas que podem ser medidas e ajustadas.

## 4. Alternativas de IA consideradas

| Abordagem | Vantagem | Limitação no escopo | Decisão |
|---|---|---|---|
| Aleatória | Implementação mínima e excelente linha de base | Não aprende nem usa memória | Manter como baseline |
| Heurística com memória limitada | Explicável, barata e diretamente calibrável | Exige escolha e validação dos parâmetros | **Selecionada** |
| MLP supervisionada | Pode estimar probabilidades a partir de dados | Exige dados rotulados; menor interpretabilidade | Trabalho futuro/comparação opcional |
| Aprendizado por reforço | Aprende estratégia por interação | Alto custo de treinamento; tende à política ótima, não humana | Trabalho futuro |
| Minimax/MCTS | Forte em busca estratégica | Informação oculta requer extensões; não modela esquecimento naturalmente | Não selecionada |

Redes neurais e aprendizado por reforço são tecnologias válidas, porém não são automaticamente a melhor escolha metodológica. Sem dados de jogadores, uma MLP aprenderia padrões sintéticos definidos pelo próprio autor; e um agente de reforço tende a maximizar vitória, exigindo restrições adicionais para não se tornar uma memória perfeita disfarçada. A heurística, por sua vez, permite defender cada comportamento em termos de uma variável observável e reproduzir exatamente o experimento por uma semente aleatória.

## 5. IA selecionada: agente heurístico de memória limitada

O agente mantém um mapa `posição → {par, última observação, força}` exclusivamente para cartas reveladas. Sua política é:

1. remover da memória cartas que já formaram pares;
2. atualizar força e recência quando qualquer jogador revela uma carta;
3. aplicar esquecimento e remover o item menos recente se a capacidade for excedida;
4. se uma carta já estiver aberta, buscar o par na memória; se não houver, escolher uma posição desconhecida ou disponível;
5. se não houver carta aberta, priorizar um par conhecido; caso contrário, explorar uma carta disponível;
6. com probabilidade `taxa_de_erro`, ignorar a melhor escolha e explorar outra opção.

Essa política implementa uma estratégia de exploração/exploração simples: utiliza pares conhecidos, mas coleta informação nova quando não consegue recuperar uma associação. Ela também evita dois vieses do protótipo inicial: conhecimento das cartas fechadas e métricas de viradas idênticas para jogador e IA.

### Parâmetros e níveis

| Nível | Capacidade | Decaimento por observação | Erro intencional | Interpretação |
|---|---:|---:|---:|---|
| Fácil | 2 posições | 0,35 | 0,30 | Pouca retenção e recuperação inconsistente |
| Médio | 4 posições | 0,15 | 0,12 | Referência inicial inspirada na memória de trabalho limitada |
| Difícil | 12 posições | 0,03 | 0,03 | Retenção alta, mas ainda sem acesso oculto ao tabuleiro |

Os valores são parâmetros iniciais, não constantes psicológicas. A hipótese é que a taxa de vitória e o número médio de viradas da IA diminuirão monotonamente de difícil para fácil. Caso isso não ocorra em simulação, os parâmetros devem ser recalibrados antes do estudo com participantes.

## 6. Ajuste dinâmico de dificuldade

Dynamic Difficulty Adjustment (DDA) modifica características do jogo em tempo de execução conforme o desempenho do jogador (Zohaib, 2018). Para preservar a validade do experimento, recomenda-se iniciar o TCC com níveis fixos. Em uma segunda fase, o modo adaptativo pode ajustar somente parâmetros já existentes — capacidade, decaimento e erro — entre turnos, nunca no meio de uma escolha já iniciada.

Um critério simples é observar a diferença de pares e a taxa de acerto em uma janela de turnos. Se o estudante vencer com ampla margem, diminui-se gradualmente o decaimento; se perder com ampla margem, aumenta-se o decaimento ou o erro. A interface deve informar que o modo é adaptativo para não comprometer a transparência pedagógica.

## 7. Desenho de avaliação

### Avaliação automatizada

Executar, para cada tamanho de tabuleiro e dificuldade, pelo menos 100 partidas com sementes distintas. Registrar: taxa de vitória, pares, número de viradas, duração, pares encontrados por conhecimento e pares por acaso. Comparar o agente heurístico com o aleatório e reportar média, desvio-padrão e intervalo de confiança.

### Avaliação com participantes

Aplicar uma sessão curta com o público-alvo, com consentimento e sem coletar dados pessoais desnecessários. Alternar a ordem dos níveis para reduzir efeito de aprendizagem. Após cada partida, perguntar em escala Likert se a dificuldade foi muito baixa, adequada ou muito alta, e se o comportamento do robô pareceu compreensível. Cruzar essa percepção com os logs objetivos.

### Hipóteses

- H1: o agente heurístico supera o aleatório em pares e em taxa de vitória.
- H2: o nível difícil supera o médio, que supera o fácil, nas métricas de desempenho da IA.
- H3: o nível médio recebe mais avaliações de desafio adequado que os extremos.

## 8. Ameaças à validade

O resultado não permite afirmar que a IA possui memória humana. Ela é uma simulação parametrizada de aspectos da memória. A amostra de participantes pode ser pequena e não representar todas as faixas etárias. Imagens semanticamente relacionadas podem permitir *chunking*, alterando a carga cognitiva. Esses fatores devem ser relatados e, quando possível, controlados por tamanho do tabuleiro, tipo de carta e ordem das condições.

## Referências

COWAN, N. The magical number 4 in short-term memory: a reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, v. 24, n. 1, p. 87–114, 2001. DOI: [10.1017/S0140525X01003922](https://doi.org/10.1017/S0140525X01003922).

MILLER, G. A. The magical number seven, plus or minus two: some limits on our capacity for processing information. *Psychological Review*, v. 63, n. 2, p. 81–97, 1956. DOI: [10.1037/h0043158](https://doi.org/10.1037/h0043158).

RICKER, T. J.; VERGAUWE, E.; COWAN, N. Decay theory of immediate memory: From Brown (1958) to today. *Quarterly Journal of Experimental Psychology*, v. 69, n. 10, p. 1969–1995, 2016. DOI: [10.1080/17470218.2014.914546](https://doi.org/10.1080/17470218.2014.914546).

ZOHAIB, M. Dynamic Difficulty Adjustment (DDA) in Computer Games: A Review. *Advances in Human-Computer Interaction*, 2018, art. 5681652. DOI: [10.1155/2018/5681652](https://doi.org/10.1155/2018/5681652).

ZWICK, U.; PATERSON, M. S. The memory game. *Theoretical Computer Science*, v. 110, n. 1, p. 169–196, 1993. DOI: [10.1016/0304-3975(93)90355-W](https://doi.org/10.1016/0304-3975(93)90355-W).
