import React from 'react';
import ConfigForm from '../components/ConfigForm';

const Configurator = () => {
  const handleGenerateGame = (configData) => {
    console.log(configData);
    alert('Configurações salvas: ' + JSON.stringify(configData));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Criar Novo Jogo</h2>
        <p>Defina as opções para gerar um jogo da memória personalizado</p>
      </div>
      <ConfigForm onSubmit={handleGenerateGame} />
    </div>
  );
};

export default Configurator;
