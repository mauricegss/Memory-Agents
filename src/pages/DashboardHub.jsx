import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import GameShelf from '../components/GameShelf';
import { supabase } from '../lib/supabase';
import { Loader2, Library, Users, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardHub = () => {
  const { user } = useAuth();
  const [recentGames,  setRecentGames]  = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [turmaGames,   setTurmaGames]   = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetchHubData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHubData = async () => {
    try {
      setLoading(true);

      const { data: allGames, error } = await supabase
        .from('memory_agents_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const gamesList = allGames || [];

      const authorIds = [...new Set(gamesList.map(g => g.author_id))];
      const { data: profilesData } = await supabase
        .from('memory_agents_profiles')
        .select('id, name')
        .in('id', authorIds);

      const profileMap = (profilesData || []).reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
      const enrichedGames = gamesList.map(g => ({ ...g, authorName: profileMap[g.author_id] || 'Professor' }));

      setRecentGames(enrichedGames.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10));
      setPopularGames([...enrichedGames].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10));

      if (user) {
        let myTurmaIds = [];
        if (user.role === 'aluno') {
          const { data: alTurmas } = await supabase.from('memory_agents_turma_alunos').select('turma_id').eq('aluno_id', user.id);
          myTurmaIds = (alTurmas || []).map(t => t.turma_id);
        } else {
          const { data: pfTurmas } = await supabase.from('memory_agents_turmas').select('id').eq('professor_id', user.id);
          myTurmaIds = (pfTurmas || []).map(t => t.id);
        }
        if (myTurmaIds.length > 0) {
          const { data: tgData } = await supabase.from('memory_agents_turma_games').select('game_id').in('turma_id', myTurmaIds);
          const gameIds = (tgData || []).map(t => t.game_id);
          setTurmaGames(enrichedGames.filter(g => gameIds.includes(g.id)));
        } else {
          setTurmaGames([]);
        }
      } else {
        setTurmaGames([]);
      }
    } catch (error) {
      console.error('[DashboardHub] Erro:', error);
      setRecentGames([]);
      setPopularGames([]);
      setTurmaGames([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="text-blue-500 font-black text-sm">Carregando jogos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin space-y-6 min-h-0">
      {/* Hero banner */}
      {user ? (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-blue-200/50 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-xs">
              <Sparkles size={13} /> {user.role === 'professor' ? 'Painel do Educador' : 'Pronto para Aprender'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Olá, {user.name?.split(' ')[0]}! 👋</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md">Escolha um jogo abaixo para desafiar o robô inteligente e treinar sua memória.</p>
          </div>
          <div className="text-5xl sm:text-6xl select-none hidden sm:block">🧠</div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-200/50 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-xs">
              ✨ Bem-vindo ao MemoryAgents
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Jogos da Memória com IA Educacional</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md">Treine com adversários inteligentes heurísticos e probabilísticos.</p>
          </div>
          <div className="text-5xl sm:text-6xl select-none hidden sm:block">🤖</div>
        </div>
      )}

      {recentGames.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
            📚
          </div>
          <h4 className="text-slate-800 font-black mb-1 text-lg">Nenhum jogo disponível ainda</h4>
          <p className="text-slate-400 text-xs">Aguarde um professor criar jogos ou faça login como professor para adicionar novos desafios.</p>
        </div>
      ) : (
        <>
          <GameShelf title="⭐ Mais Jogados" icon={null}>
            {popularGames.map((game, i) => (
              <GameCard
                key={`pop-${game.id}`}
                id={game.id}
                title={game.title}
                author={game.authorName}
                authorId={game.author_id}
                completions={game.plays || 0}
                fallbackColor={i % 3 === 0 ? 'bg-blue-500' : i % 3 === 1 ? 'bg-indigo-500' : 'bg-sky-500'}
              />
            ))}
          </GameShelf>

          {user && turmaGames.length > 0 && (
            <GameShelf title="🏫 Atividades das Minhas Turmas">
              {turmaGames.map((game, i) => (
                <GameCard
                  key={`turma-${game.id}`}
                  id={game.id}
                  title={game.title}
                  author={game.authorName}
                  authorId={game.author_id}
                  completions={game.plays || 0}
                  fallbackColor={i % 2 === 0 ? 'bg-emerald-500' : 'bg-teal-500'}
                />
              ))}
            </GameShelf>
          )}

          <GameShelf title="🆕 Adicionados Recentemente">
            {recentGames.map((game, i) => (
              <GameCard
                key={`rec-${game.id}`}
                id={game.id}
                title={game.title}
                author={game.authorName}
                authorId={game.author_id}
                completions={game.plays || 0}
                fallbackColor={i % 3 === 0 ? 'bg-cyan-500' : i % 3 === 1 ? 'bg-blue-400' : 'bg-violet-500'}
              />
            ))}
          </GameShelf>
        </>
      )}
    </div>
  );
};

export default DashboardHub;
