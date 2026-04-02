import React from 'react';
import { ThumbsUp, Play, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ id, title, author, likes, imageUrl, fallbackColor = 'bg-indigo-500', url }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex-shrink-0 w-[220px] sm:w-[240px] group cursor-pointer flex flex-col gap-2 snap-start"
      onClick={() => navigate(url || `/play/${id}`)}
    >
      <div className={`w-full aspect-[16/9] ${imageUrl ? '' : fallbackColor} rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all`}>
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
        <h4 className="font-bold text-slate-100 truncate leading-tight group-hover:underline decoration-slate-600">{title}</h4>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
          <div className="flex items-center gap-1">
            <ThumbsUp size={12} className={likes > 80 ? "text-emerald-500" : "text-slate-600"} />
            <span className="font-bold text-slate-300">{likes}%</span>
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
