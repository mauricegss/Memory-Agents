# Memory Agents

**Plataforma Web para Geração de Jogos da Memória com Adversários de IA**

Este repositório contém o código-fonte desenvolvido para o Trabalho de Conclusão de Curso (TCC) de **Maurice Golin Soares dos Santos**, no Bacharelado em Ciência da Computação pela Universidade Tecnológica Federal do Paraná (UTFPR) - Câmpus Ponta Grossa.

## 📖 Sobre o Projeto

Plataformas de jogos educacionais como Wordwall e Kahoot! são amplamente utilizadas, mas em sua maioria, os jogadores competem contra o tempo ou contra outros humanos, sendo ambientes essencialmente estáticos. 

O **Memory Agents** propõe o desenvolvimento de uma plataforma web focada na criação e hospedagem de jogos educacionais dinâmicos. Como prova de conceito, o foco inicial é o módulo do **Jogo da Memória**, que integra de forma inovadora um **agente de Inteligência Artificial (IA) que atua como adversário do jogador**. O objetivo é simular comportamentos semelhantes aos humanos (raciocínio, memória heurística e falhas), buscando uma experiência de gamificação mais desafiadora e envolvente do que a simples eficiência máxima em vitórias.

## 🎯 Objetivos

- **Objetivo Geral:** Desenvolver uma plataforma web estruturada para a geração de jogos educacionais, implementando inicialmente o Jogo da Memória, que inclua um agente de IA adversário capaz de simular um comportamento humano competitivo.
- **Para Educadores:** Módulo de criação que permite upload de imagens e configuração das regras e parâmetros do Jogo da Memória.
- **Para Estudantes:** Interface acessível para jogar os desafios disponibilizados publicamente ou vinculados via turmas/códigos pelos professores.
- **Pesquisa em IA:** Criação de um ambiente de simulação para testar, validar e comparar diferentes algoritmos de IA (de regras heurísticas a aprendizado de máquina), sob a ótica da "simulação humana".

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, estilização responsiva com Tailwind CSS, estruturação modular com Vite.
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Autenticação, Row Level Security, Storage para envio de imagens).
- **Ambiente de Simulação (IA):** Python e Pygame (utilizados de forma independente da plataforma web para experimentação e modelagem das lógicas e arquiteturas dos agentes, como Redes Neurais).

## 🚀 Como Executar Localmente

1. Clone o repositório.
2. Instale as dependências com `npm install`.
3. Configure as variáveis de ambiente renomeando `.env.example` para `.env` e adicionando suas chaves do Supabase.
4. Rode o ambiente de desenvolvimento local com `npm run dev`.
5. Acesse `http://localhost:5173`.

## 👨‍🎓 Autor

- **Aluno:** Maurice Golin Soares dos Santos ([maurice@alunos.utfpr.edu.br](mailto:maurice@alunos.utfpr.edu.br))
- **Orientadora:** Profa. Dra. Helyane Bronoski Borges
- **Instituição:** UTFPR - Câmpus Ponta Grossa (Departamento Acadêmico de Informática)
