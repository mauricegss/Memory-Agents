import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import GameShelf from '../components/GameShelf';
import { supabase } from '../lib/supabase';
import { Loader2, Library } from 'lucide-react';

const DashboardHub = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          title,
          likes,
          author_id,
          profiles (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-bold">Carregando catálogo de jogos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto">
      
      {games.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-12 text-center mt-12">
           <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Library size={32} />
           </div>
           <h4 className="text-slate-300 font-bold mb-1">Nenhum jogo encontrado</h4>
           <p className="text-slate-500 text-sm">Ainda não há jogos publicados na plataforma.</p>
        </div>
      ) : (
        <>
          <GameShelf title="Adicionados Recentemente">
            {games.slice(0, 5).map(game => (
              <GameCard 
                key={game.id} 
                id={game.id} 
                title={game.title} 
                author={game.profiles?.name || 'Professor'} 
                likes={game.likes} 
                fallbackColor="bg-indigo-600" 
              />
            ))}
          </GameShelf>

          {games.length > 5 && (
            <GameShelf title="Todos os Jogos">
              {games.slice(5).map((game, i) => (
                <GameCard 
                  key={game.id} 
                  id={game.id} 
                  title={game.title} 
                  author={game.profiles?.name || 'Professor'} 
                  likes={game.likes} 
                  fallbackColor={i % 2 === 0 ? "bg-emerald-600" : "bg-cyan-600"} 
                />
              ))}
            </GameShelf>
          )}
        </>
      )}

    </div>
  );
};

export default DashboardHub;