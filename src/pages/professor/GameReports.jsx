import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/* eslint-disable react-hooks/exhaustive-deps */

const GameReports = () => {
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turma');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [turmaInfo, setTurmaInfo] = useState(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [turmaId, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (turmaId) {
        // Fetch turma name
        const { data: tData } = await supabase.from('memory_agents_turmas').select('name').eq('id', turmaId).single();
        if (tData) setTurmaInfo(tData);

        // Fetch sessions
        const { data, error } = await supabase
          .from('memory_agents_matches')
          .select(`
            id, player_score, player_flips, total_time_seconds, created_at,
            memory_agents_profiles (name),
            memory_agents_games (title)
          `)
          .eq('turma_id', turmaId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } else {
        // Global Reports: Fetch all games by this professor
        const { data: myGames } = await supabase.from('memory_agents_games').select('id').eq('author_id', user.id);
        const gameIds = (myGames || []).map(g => g.id);
        
        if (gameIds.length > 0) {
           const { data, error } = await supabase
            .from('memory_agents_matches')
            .select(`
              id, player_score, player_flips, total_time_seconds, created_at, turma_id,
              memory_agents_profiles (name),
              memory_agents_games (title)
            `)
            .in('game_id', gameIds)
            .order('created_at', { ascending: false });

           if (error) throw error;
           
           // Fetch all possible turmas to map the names
           const { data: turmasData } = await supabase.from('memory_agents_turmas').select('id, name');
           const turmasMap = (turmasData || []).reduce((acc, t) => ({...acc, [t.id]: t.name}), {});
           
           const mappedSessions = (data||[]).map(s => ({
              ...s,
              turmaName: s.turma_id ? (turmasMap[s.turma_id] || 'Turma não encontrada') : 'Atividade Avulsa'
           }));
           setSessions(mappedSessions);
        } else {
           setSessions([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-bold transition-colors"
        >
          <ChevronLeft size={20} /> Voltar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-lg flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 text-indigo-400 font-black tracking-widest text-xs uppercase">
            <BarChart3 size={16} /> Relatório de Rendimento
          </div>
          <h1 className="text-3xl font-black text-slate-100">
            {turmaInfo ? `Turma: ${turmaInfo.name}` : 'Visão Geral (Global)'}
          </h1>
          <p className="text-slate-400 mt-2">Acompanhe os resultados das partidas dos alunos {turmaInfo ? 'desta turma' : 'em todos os seus jogos'}.</p>
        </div>
        <div className="bg-slate-950 px-6 py-4 rounded-2xl border border-slate-800 flex gap-8 text-center text-sm">
           <div>
              <p className="text-slate-500 font-bold mb-1">Partidas Realizadas</p>
              <p className="text-2xl font-black text-slate-200">{sessions.length}</p>
           </div>
           <div>
              <p className="text-slate-500 font-bold mb-1">Taxa Media Erro</p>
              <p className="text-2xl font-black text-rose-400">
                {sessions.length > 0 ? (sessions.reduce((acc, s) => acc + (s.player_flips - s.player_score), 0) / sessions.length).toFixed(1) : 0}
              </p>
           </div>
        </div>
      </div>

      {loading ? (
         <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando métricas...</div>
      ) : sessions.length === 0 ? (
         <div className="bg-slate-900 border border-slate-800 border-dashed p-16 text-center rounded-3xl">
           <p className="text-slate-400 font-medium">Nenhuma partida finalizada pelos alunos ainda.</p>
         </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900 rounded-3xl border border-slate-800">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-black">
                 {!turmaId && <th className="p-4 rounded-tl-3xl">Turma</th>}
                 <th className={`p-4 ${turmaId ? 'rounded-tl-3xl' : ''}`}>Aluno</th>
                 <th className="p-4">Atividade / Jogo</th>
                 <th className="p-4">Finalizado</th>
                 <th className="p-4 text-center">Tempo</th>
                 <th className="p-4 text-center">Acertos</th>
                 <th className="p-4 text-center rounded-tr-3xl">Erros</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800/50 text-sm font-medium text-slate-300">
               {sessions.map(s => (
                 <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                   {!turmaId && <td className="p-4 text-slate-400 font-medium">{s.turmaName}</td>}
                   <td className="p-4 text-slate-100 font-bold">{s.memory_agents_profiles?.name || 'Aluno Excluído'}</td>
                   <td className="p-4 text-indigo-300">{s.memory_agents_games?.title || 'Desconhecido'}</td>
                   <td className="p-4 text-slate-500">{new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</td>
                   <td className="p-4 text-center text-amber-200 flex items-center justify-center gap-1.5"><Clock size={14}/> {formatTime(s.total_time_seconds)}</td>
                   <td className="p-4 text-center text-emerald-400"><span className="flex justify-center items-center gap-1"><CheckCircle2 size={14}/> {s.player_score}</span></td>
                   <td className="p-4 text-center text-rose-400"><span className="flex justify-center items-center gap-1"><XCircle size={14}/> {Math.max(0, s.player_flips - s.player_score)}</span></td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GameReports;
