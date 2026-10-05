import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const GameShelf = ({ title, children, icon }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-2 relative group/shelf">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <h3 className="text-lg font-black text-slate-700">{title}</h3>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white shadow-lg p-2 rounded-full border-2 border-blue-100 text-blue-500 opacity-0 group-hover/shelf:opacity-100 transition-all hover:bg-blue-50 hover:scale-110 hidden md:block"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white shadow-lg p-2 rounded-full border-2 border-blue-100 text-blue-500 opacity-0 group-hover/shelf:opacity-100 transition-all hover:bg-blue-50 hover:scale-110 hidden md:block"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default GameShelf;
