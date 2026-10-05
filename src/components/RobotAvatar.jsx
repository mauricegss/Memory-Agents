import React from 'react';

/**
 * RobotAvatar — Mascote robozinho animado para a IA adversária
 * Props:
 *   isThinking {bool}  — IA está escolhendo a carta
 *   isWalking  {bool}  — turno da IA ativo
 *   score      {number}— pontuação atual da IA (muda a expressão)
 *   playerScore{number}— pontuação do jogador (para comparar expressão)
 *   size       {number}— tamanho base em px (default 120)
 */
const RobotAvatar = ({ isThinking = false, isWalking = false, score = 0, playerScore = 0, size = 120 }) => {
  const isHappy = score >= playerScore;
  const animClass = isThinking ? 'robot-think' : isWalking ? 'robot-walk' : 'robot-idle';

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Balão de fala */}
      <div className={`
        relative px-3 py-1.5 bg-white border-2 border-blue-200 rounded-2xl text-xs font-bold text-blue-600
        shadow-sm transition-all duration-300
        ${isThinking ? 'opacity-100 scale-100' : isWalking ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
      `}>
        {isThinking ? '🤔 Pensando...' : isWalking ? '🎯 Jogando!' : ''}
        {/* Ponta do balão */}
        <div className="absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-blue-200 rotate-45" />
      </div>

      {/* SVG do robô */}
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 100 125"
        xmlns="http://www.w3.org/2000/svg"
        className={animClass}
        style={{ filter: 'drop-shadow(0 4px 6px rgba(37,99,235,0.25))' }}
      >
        {/* Antena */}
        <line x1="50" y1="8" x2="50" y2="20" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round"/>
        <circle
          cx="50" cy="6" r="4"
          fill={isThinking ? '#FCD34D' : '#60A5FA'}
          className={isThinking ? 'antenna-pulse' : ''}
        />

        {/* Cabeça */}
        <rect x="25" y="18" width="50" height="40" rx="12" fill="#3B82F6"/>
        {/* Brilho da cabeça */}
        <ellipse cx="40" cy="26" rx="8" ry="5" fill="rgba(255,255,255,0.2)"/>

        {/* Olho esquerdo */}
        <g className="robot-eye" style={{ transformOrigin: '37px 35px' }}>
          <circle cx="37" cy="35" r="8" fill="white"/>
          <circle cx={isThinking ? '39' : '37'} cy="35" r="4" fill={isHappy ? '#1D4ED8' : '#374151'}/>
          <circle cx={isThinking ? '40' : '38'} cy="33" r="1.5" fill="white"/>
        </g>

        {/* Olho direito */}
        <g className="robot-eye" style={{ transformOrigin: '63px 35px', animationDelay: '0.3s' }}>
          <circle cx="63" cy="35" r="8" fill="white"/>
          <circle cx={isThinking ? '61' : '63'} cy="35" r="4" fill={isHappy ? '#1D4ED8' : '#374151'}/>
          <circle cx={isThinking ? '62' : '64'} cy="33" r="1.5" fill="white"/>
        </g>

        {/* Boca — feliz ou neutro */}
        {isHappy ? (
          <path d="M 38 50 Q 50 58 62 50" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        ) : (
          <line x1="40" y1="52" x2="60" y2="52" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        )}

        {/* Orelhas / parafusos */}
        <rect x="20" y="28" width="6" height="14" rx="3" fill="#1D4ED8"/>
        <rect x="74" y="28" width="6" height="14" rx="3" fill="#1D4ED8"/>

        {/* Pescoço */}
        <rect x="43" y="58" width="14" height="8" rx="3" fill="#2563EB"/>

        {/* Corpo */}
        <rect x="22" y="66" width="56" height="40" rx="10" fill="#2563EB"/>
        {/* Detalhe do peito */}
        <rect x="34" y="74" width="32" height="18" rx="6" fill="#1D4ED8"/>
        {/* Luzes do peito */}
        <circle cx="42" cy="83" r="3" fill={isThinking ? '#FCD34D' : '#60A5FA'}
          style={{ filter: isThinking ? 'drop-shadow(0 0 4px #FCD34D)' : 'none' }}
        />
        <circle cx="50" cy="83" r="3" fill={isWalking ? '#34D399' : '#60A5FA'}
          style={{ filter: isWalking ? 'drop-shadow(0 0 4px #34D399)' : 'none' }}
        />
        <circle cx="58" cy="83" r="3" fill="#60A5FA"/>

        {/* Braço esquerdo */}
        <rect
          x="8" y="68" width="13" height="32" rx="6"
          fill="#3B82F6"
          transform={isWalking ? 'rotate(-15 14 68)' : isThinking ? 'rotate(10 14 68)' : 'rotate(0 14 68)'}
          style={{ transformOrigin: '14px 68px', transition: 'transform 0.3s' }}
        />
        <circle cx="14" cy="104" r="5" fill="#1D4ED8"/>

        {/* Braço direito */}
        <rect
          x="79" y="68" width="13" height="32" rx="6"
          fill="#3B82F6"
          transform={isWalking ? 'rotate(15 86 68)' : isThinking ? 'rotate(-10 86 68)' : 'rotate(0 86 68)'}
          style={{ transformOrigin: '86px 68px', transition: 'transform 0.3s' }}
        />
        <circle cx="86" cy="104" r="5" fill="#1D4ED8"/>

        {/* Perna esquerda */}
        <rect
          x="32" y="104" width="14" height="18" rx="6"
          fill="#1D4ED8"
          transform={isWalking ? 'rotate(-10 39 104)' : 'rotate(0 39 104)'}
          style={{ transformOrigin: '39px 104px', transition: 'transform 0.25s' }}
        />
        <rect x="28" y="118" width="18" height="6" rx="3" fill="#1E3A8A"/>

        {/* Perna direita */}
        <rect
          x="54" y="104" width="14" height="18" rx="6"
          fill="#1D4ED8"
          transform={isWalking ? 'rotate(10 61 104)' : 'rotate(0 61 104)'}
          style={{ transformOrigin: '61px 104px', transition: 'transform 0.25s', animationDelay: '0.25s' }}
        />
        <rect x="54" y="118" width="18" height="6" rx="3" fill="#1E3A8A"/>
      </svg>

      {/* Label */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-black text-blue-600 uppercase tracking-wide">Robô IA</span>
        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-2 h-2 rounded-full ${isThinking || isWalking ? 'bg-green-400 animate-pulse' : 'bg-blue-200'}`} />
          <span className="text-[10px] text-slate-400 font-semibold">
            {isThinking ? 'pensando' : isWalking ? 'jogando' : 'aguardando'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RobotAvatar;
