import { ThumbsUp, Play, User as UserIcon, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const GameCard = ({ id, title, author, completions = 0, imageUrl, fallbackColor = 'bg-indigo-500', url }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex-shrink-0 w-[220px] sm:w-[240px] group flex flex-col gap-2 snap-start">
      <div 
        className={`w-full aspect-[16/9] ${imageUrl ? '' : fallbackColor} rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all cursor-pointer`}
        onClick={() => navigate(url || `/play/${id}`)}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-white/10 to-black/20">
            <span className="text-white/50 font-black text-4xl">{title[0]}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
           <Play fill="currentColor" size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300" />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-slate-100 truncate leading-tight group-hover:underline decoration-slate-600 cursor-pointer" onClick={() => navigate(url || `/play/${id}`)}>{title}</h4>
          {user?.role === 'professor' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                alert('Em breve você poderá ver os relatórios deste jogo!');
              }}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
              title="Ver Relatórios"
            >
              <BarChart3 size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
          <div className="flex items-center gap-1" title="Completudes (jogadas realizadas)">
            <Play size={12} className={completions > 20 ? "text-emerald-500 fill-emerald-500" : "text-slate-600"} />
            <span className="font-bold text-slate-300">{completions}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserIcon size={12} />
            <span className="truncate max-w-[120px]">{author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default GameCard;
