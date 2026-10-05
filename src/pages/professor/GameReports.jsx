import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, BarChart3, Clock, CheckCircle2, XCircle, Users, Trophy } from 'lucide-react';
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
        const { data: tData } = await supabase.from('memory_agents_turmas').select('name').eq('id', turmaId).single();
        if (tData) setTurmaInfo(tData);

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
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0 space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} /> Voltar ao Painel
        </button>
      </div>

      {/* Header com Resumo de Rendimento */}
      <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
            <BarChart3 size={15} /> Relatório de Desempenho
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {turmaInfo ? `Turma: ${turmaInfo.name}` : 'Rendimento Geral dos Seus Jogos'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Resultados consolidados das partidas dos alunos {turmaInfo ? 'nesta turma' : 'em todas as atividades'}.
          </p>
        </div>

        <div className="flex gap-4 bg-blue-50/80 px-6 py-4 rounded-2xl border border-blue-100 text-center">
           <div>
              <p className="text-slate-500 font-black text-[11px] uppercase tracking-wider mb-0.5">Partidas</p>
              <p className="text-2xl font-black text-blue-600">{sessions.length}</p>
           </div>
           <div className="w-px bg-blue-200" />
           <div>
              <p className="text-slate-500 font-black text-[11px] uppercase tracking-wider mb-0.5">Taxa Média de Erros</p>
              <p className="text-2xl font-black text-amber-600">
                {sessions.length > 0 ? (sessions.reduce((acc, s) => acc + Math.max(0, s.player_flips - s.player_score), 0) / sessions.length).toFixed(1) : 0}
              </p>
           </div>
        </div>
      </div>

      {/* Tabela de Partidas */}
      {loading ? (
         <div className="text-center py-20 animate-pulse text-blue-600 font-black text-sm">Carregando métricas dos alunos...</div>
      ) : sessions.length === 0 ? (
         <div className="bg-white border-2 border-dashed border-blue-200 p-12 text-center rounded-3xl shadow-xs">
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
             📊
           </div>
           <p className="text-slate-600 font-black mb-1">Nenhuma partida registrada ainda</p>
           <p className="text-slate-400 text-xs">Assim que os alunos jogarem, as estatísticas de tempo, acertos e tentativas aparecerão aqui.</p>
         </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-3xl border border-blue-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-blue-50/70 border-b border-blue-100 text-slate-600 text-[11px] uppercase tracking-wider font-black">
                   {!turmaId && <th className="p-4">Turma</th>}
                   <th className="p-4">Aluno</th>
                   <th className="p-4">Atividade / Jogo</th>
                   <th className="p-4">Data / Hora</th>
                   <th className="p-4 text-center">Tempo</th>
                   <th className="p-4 text-center">Pares Acertados</th>
                   <th className="p-4 text-center">Erros</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-blue-50 text-xs font-semibold text-slate-700">
                 {sessions.map(s => (
                   <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                     {!turmaId && <td className="p-4 text-slate-500 font-bold">{s.turmaName}</td>}
                     <td className="p-4 font-black text-slate-800">{s.memory_agents_profiles?.name || 'Aluno'}</td>
                     <td className="p-4 text-blue-600 font-bold">{s.memory_agents_games?.title || 'Desconhecido'}</td>
                     <td className="p-4 text-slate-400 font-medium">
                       {new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                     </td>
                     <td className="p-4 text-center text-slate-600">
                       <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                         <Clock size={12} className="text-slate-400" /> {formatTime(s.total_time_seconds || 0)}
                       </span>
                     </td>
                     <td className="p-4 text-center">
                       <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg border border-emerald-200/60">
                         <CheckCircle2 size={13} className="text-emerald-500" /> {s.player_score}
                       </span>
                     </td>
                     <td className="p-4 text-center">
                       <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-black px-2.5 py-1 rounded-lg border border-rose-200/60">
                         <XCircle size={13} className="text-rose-500" /> {Math.max(0, s.player_flips - s.player_score)}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameReports;
