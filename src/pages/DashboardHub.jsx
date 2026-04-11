import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import GameShelf from '../components/GameShelf';
import { supabase } from '../lib/supabase';
import { Loader2, Library, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardHub = () => {
  const { user } = useAuth();
  const [recentGames, setRecentGames] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [turmaGames, setTurmaGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubData();
  }, [user]);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      
      // 1. Busca todos os jogos (sem relacionamento para evitar quebras)
      const { data: allGames, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const gamesList = allGames || [];

      // 2. Busca nomes dos criadores manualmente
      const authorIds = [...new Set(gamesList.map(g => g.author_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', authorIds);
        
      const profileMap = (profilesData || []).reduce((acc, p) => ({...acc, [p.id]: p.name }), {});
      
      // Enriquece
      const enrichedGames = gamesList.map(g => ({
         ...g,
         authorName: profileMap[g.author_id] || 'Professor'
      }));

      // Adicionados Recentemente
      setRecentGames(enrichedGames.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10));
      
      // Mais Jogados (Completudes)
      const popular = [...enrichedGames].sort((a,b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
      setPopularGames(popular);
      
      // Seções da Turma
      if (user) {
         let myTurmaIds = [];
         if (user.role === 'aluno') {
            const { data: alTurmas } = await supabase.from('turma_alunos').select('turma_id').eq('aluno_id', user.id);
            myTurmaIds = (alTurmas || []).map(t => t.turma_id);
         } else {
            const { data: pfTurmas } = await supabase.from('turmas').select('id').eq('professor_id', user.id);
            myTurmaIds = (pfTurmas || []).map(t => t.id);
         }
         
         if (myTurmaIds.length > 0) {
             const { data: tgData } = await supabase.from('turma_games').select('game_id').in('turma_id', myTurmaIds);
             const gameIds = (tgData || []).map(t => t.game_id);
             
             const myTurmaGamesList = enrichedGames.filter(g => gameIds.includes(g.id));
             setTurmaGames(myTurmaGamesList);
         } else {
             setTurmaGames([]);
         }
      } else {
         setTurmaGames([]);
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados do hub:', error);
      setRecentGames([]);
      setPopularGames([]);
      setTurmaGames([]);
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
    <div className="space-y-4 py-4 max-w-7xl mx-auto flex flex-col justify-center min-h-[70vh]">
      {recentGames.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-12 text-center mt-12">
           <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Library size={32} />
           </div>
           <h4 className="text-slate-300 font-bold mb-1">Nenhum jogo encontrado</h4>
           <p className="text-slate-500 text-sm">Ainda não há jogos publicados na plataforma.</p>
        </div>
      ) : (
        <>
          <GameShelf title="Mais Jogados (Global)">
            {popularGames.map((game, i) => (
              <GameCard 
                key={`pop-${game.id}`} 
                id={game.id} 
                title={game.title} 
                author={game.authorName} 
                completions={game.plays || 0} 
                fallbackColor={i % 2 === 0 ? "bg-purple-600" : "bg-indigo-600"} 
              />
            ))}
          </GameShelf>

          {user && turmaGames.length > 0 && (
            <GameShelf title="Atividades das Minhas Turmas" icon={<Users className="text-emerald-400" />}>
              {turmaGames.map((game, i) => (
                <GameCard 
                  key={`turma-${game.id}`} 
                  id={game.id} 
                  title={game.title} 
                  author={game.authorName} 
                  completions={game.plays || 0} 
                  fallbackColor={i % 2 === 0 ? "bg-emerald-600" : "bg-teal-600"} 
                />
              ))}
            </GameShelf>
          )}

          <GameShelf title="Adicionados Recentemente">
            {recentGames.map((game, i) => (
              <GameCard 
                key={`rec-${game.id}`} 
                id={game.id} 
                title={game.title} 
                author={game.authorName} 
                completions={game.plays || 0} 
                fallbackColor={i % 2 === 0 ? "bg-cyan-600" : "bg-blue-600"} 
              />
            ))}
          </GameShelf>
        </>
      )}

    </div>
  );
};

export default DashboardHub;