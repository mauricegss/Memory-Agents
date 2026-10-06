import { Play, User as UserIcon, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GameCard = ({ id, title, author, authorId, completions = 0, imageUrl, fallbackColor = 'bg-blue-500', url, turmaId, fill = false, onEdit = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const titleGlyph = title?.match(/\p{Extended_Pictographic}(\uFE0F)?/u)?.[0];

  const handlePlayClick = () => {
    if (url) {
      navigate(url);
    } else {
      const playUrl = turmaId ? `/play/${id}?turma=${turmaId}` : `/play/${id}`;
      navigate(playUrl);
    }
  };

  return (
    <div className={`flex-shrink-0 group flex flex-col gap-2 snap-start ${fill ? 'h-full min-h-0 w-[200px] sm:w-[240px]' : 'w-[190px] sm:w-[210px]'}`}>
      <div
        className={`w-full ${fill ? 'flex-1 min-h-0' : 'aspect-[4/3]'} ${imageUrl ? 'bg-slate-100' : fallbackColor} rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent group-hover:border-blue-400 group-hover:-translate-y-1`}
        onClick={handlePlayClick}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/15" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15" />
            {titleGlyph ? (
              <span className="relative text-5xl drop-shadow-sm select-none group-hover:scale-110 transition-transform duration-300">
                {titleGlyph}
              </span>
            ) : (
              <div className="relative w-14 h-14 rounded-2xl bg-white/25 border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-black text-3xl drop-shadow-sm select-none">
                  {title ? title[0].toUpperCase() : '🎮'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Hover overlay with button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-3">
          <div className="bg-white text-blue-600 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Play fill="currentColor" size={14} className="ml-0.5" />
            <span>Jogar Agora</span>
          </div>
        </div>

        {/* Plays Badge */}
        {completions > 0 && (
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Play size={9} fill="currentColor" /> {completions}
          </div>
        )}
      </div>

      <div className="px-0.5 shrink-0">
        <div className="flex justify-between items-start gap-1.5">
          <h4 
            className="font-black text-slate-800 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors cursor-pointer" 
            onClick={handlePlayClick}
            title={title}
          >
            {title}
          </h4>
          <div className="flex items-center gap-0.5 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-md hover:bg-blue-50"
                title="Editar este jogo"
              >
                <Settings size={14} />
              </button>
            )}
            {user?.role === 'professor' && user?.id === authorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/professor/relatorios${turmaId ? `?turma=${turmaId}` : ''}`);
                }}
                className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                title="Ver Relatórios deste jogo"
              >
                <BarChart3 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-semibold">
          <div className="flex items-center gap-1">
            <UserIcon size={11} className="text-slate-400" />
            <span className="truncate max-w-[120px] text-[11px] font-bold text-slate-500">{author || 'Professor'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
