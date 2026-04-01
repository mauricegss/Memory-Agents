import React, { useState } from 'react';
import { Grid, Zap, Type, Image, Hash, PlaySquare } from 'lucide-react';

const ConfigForm = ({ onSubmit }) => {
  const [boardSize, setBoardSize] = useState('4x4');
  const [difficulty, setDifficulty] = useState('medium');
  const [cardType, setCardType] = useState('images');
  const [theme, setTheme] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ boardSize, difficulty, cardType, theme: cardType === 'images' ? theme : null });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label"><Grid size={20} /> Tamanho do Tabuleiro</label>
        <select 
          className="form-control" 
          value={boardSize} 
          onChange={(e) => setBoardSize(e.target.value)}
        >
          <option value="2x2">2x2 (4 cartas - Muito Curto)</option>
          <option value="4x4">4x4 (16 cartas - Normal)</option>
          <option value="6x6">6x6 (36 cartas - Longo)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label"><Zap size={20} /> Nível de Dificuldade</label>
        <select 
          className="form-control" 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Fácil (Cartas ficam visíveis mais tempo)</option>
          <option value="medium">Médio (Padrão)</option>
          <option value="hard">Difícil (Cartas viram rápido)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label"><Type size={20} /> Tipo de Cartas</label>
        <div className="radio-group">
          <label className={`radio-card ${cardType === 'images' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="cardType" 
              value="images" 
              checked={cardType === 'images'} 
              onChange={() => setCardType('images')} 
            />
            <Image size={28} className="icon" />
            <span className="label">Imagens</span>
          </label>
          <label className={`radio-card ${cardType === 'numbers' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="cardType" 
              value="numbers" 
              checked={cardType === 'numbers'} 
              onChange={() => setCardType('numbers')} 
            />
            <Hash size={28} className="icon" />
            <span className="label">Números</span>
          </label>
          <label className={`radio-card ${cardType === 'texts' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="cardType" 
              value="texts" 
              checked={cardType === 'texts'} 
              onChange={() => setCardType('texts')} 
            />
            <Type size={28} className="icon" />
            <span className="label">Textos</span>
          </label>
        </div>
      </div>

      {cardType === 'images' && (
        <div className="form-group" style={{ animation: 'fadeIn 0.4s ease' }}>
          <label className="form-label">Tema das Imagens</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ex: Bandeiras, Animais, Frutas..." 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
          />
        </div>
      )}

      <button type="submit" className="btn">
        <PlaySquare size={24} />
        Gerar Jogo
      </button>
    </form>
  );
};

export default ConfigForm;
