import React from 'react';
import ConfigForm from '../../components/ConfigForm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Configurator = () => {
  const navigate = useNavigate();

  const handleGenerateGame = (configData) => {
    // Aqui enviaremos para o backend (API POST /games)
    console.log("Salvando jogo:", configData);
    alert('Jogo criado com sucesso! Redirecionando para o seu Dashboard.');
    navigate('/professor');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/professor')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Voltar ao Painel
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-100">Configurar Desafio de IA</h2>
        <p className="text-slate-400">Personalize o tabuleiro e o comportamento do adversário inteligente.</p>
      </div>

      <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-2">
        <ConfigForm onSubmit={handleGenerateGame} />
      </div>
    </div>
  );
};

export default Configurator;