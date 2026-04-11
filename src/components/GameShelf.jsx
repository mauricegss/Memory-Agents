import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const GameShelf = ({ title, children, showMoreLink }) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-1 relative group/shelf">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h3>
        {showMoreLink && (
          <button className="text-sm font-bold text-slate-400 hover:text-slate-100 transition-colors">
            Ver Tudo
          </button>
        )}
      </div>
      
      <div className="relative">
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-slate-800 shadow-lg p-3 rounded-full border border-slate-700 text-slate-300 opacity-0 group-hover/shelf:opacity-100 transition-all hover:bg-slate-700 hover:scale-110 hidden md:block"
        >
          <ChevronLeft size={24} />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 pt-1 scrollbar-hide px-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-slate-800 shadow-lg p-3 rounded-full border border-slate-700 text-slate-300 opacity-0 group-hover/shelf:opacity-100 transition-all hover:bg-slate-700 hover:scale-110 hidden md:block"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}} />
    </section>
  );
};

export default GameShelf;
