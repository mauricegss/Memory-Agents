# Importa a classe base
from .agente_base import Agente

# Importa os agentes específicos
from .agente_humano import AgenteHumano
from .agente_aleatorio import AgenteAleatorio
from .agente_memoria import AgenteComMemoria
from .agente_mlp import AgenteMLP
from .agente_knn import AgenteKNN
from .agente_ql import AgenteQLearning

# Importa as funções de utilidade
from .utils_treinamento import gerar_dados_treino, pre_treinar_agente_ql

# Define o que será exportado quando alguém fizer "from agentes import *"
__all__ = [
    'Agente',
    'AgenteHumano',
    'AgenteAleatorio',
    'AgenteComMemoria',
    'AgenteMLP',
    'AgenteKNN',
    'AgenteQLearning',
    'gerar_dados_treino',
    'pre_treinar_agente_ql'
]