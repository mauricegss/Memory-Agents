import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const GameReports = () => {
  const [searchParams] = useSearchParams();
  const turmaId = searchParams.get('turma');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [turmaInfo, setTurmaInfo] = useState(null);

  useEffect(() => {
    if (turmaId && user) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [turmaId, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch turma name
      const { data: tData } = await supabase.from('turmas').select('name').eq('id', turmaId).single();
      if (tData) setTurmaInfo(tData);

      // Fetch sessions
      const { data, error } = await supabase
        .from('game_sessions')
        .select(`
          id, score, errors, time_seconds, created_at,
          profiles (name),
          games (title)
        `)
        .eq('turma_id', turmaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
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
    <div className="max-w-6xl mx-auto py-6 space-y-6">
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
            {turmaInfo ? `Turma: ${turmaInfo.name}` : 'Visão Geral'}
          </h1>
          <p className="text-slate-400 mt-2">Acompanhe os resultados das partidas dos alunos desta turma.</p>
        </div>
        <div className="bg-slate-950 px-6 py-4 rounded-2xl border border-slate-800 flex gap-8 text-center text-sm">
           <div>
              <p className="text-slate-500 font-bold mb-1">Partidas</p>
              <p className="text-2xl font-black text-slate-200">{sessions.length}</p>
           </div>
           <div>
              <p className="text-slate-500 font-bold mb-1">Taxa Media Erro</p>
              <p className="text-2xl font-black text-rose-400">
                {sessions.length > 0 ? (sessions.reduce((acc, s) => acc + s.errors, 0) / sessions.length).toFixed(1) : 0}
              </p>
           </div>
        </div>
      </div>

      {!turmaId ? (
         <div className="bg-amber-900/20 border border-amber-900/50 p-6 rounded-2xl flex items-start gap-4 text-amber-200">
           <AlertCircle className="mt-1" />
           <p className="font-medium">Você precisa selecionar uma turma partir do seu Dashboard para visualizar os relatórios filtrados.</p>
         </div>
      ) : loading ? (
         <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando métricas...</div>
      ) : sessions.length === 0 ? (
         <div className="bg-slate-900 border border-slate-800 border-dashed p-16 text-center rounded-3xl">
           <p className="text-slate-400 font-medium">Nenhuma partida finalizada pelos alunos desta turma ainda.</p>
         </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900 rounded-3xl border border-slate-800">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-black">
                 <th className="p-4 rounded-tl-3xl">Aluno</th>
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
                   <td className="p-4 text-slate-100 font-bold">{s.profiles?.name || 'Aluno Excluído'}</td>
                   <td className="p-4 text-indigo-300">{s.games?.title || 'Desconhecido'}</td>
                   <td className="p-4 text-slate-500">{new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</td>
                   <td className="p-4 text-center text-amber-200 flex items-center justify-center gap-1.5"><Clock size={14}/> {formatTime(s.time_seconds)}</td>
                   <td className="p-4 text-center text-emerald-400"><span className="flex justify-center items-center gap-1"><CheckCircle2 size={14}/> {s.score}</span></td>
                   <td className="p-4 text-center text-rose-400"><span className="flex justify-center items-center gap-1"><XCircle size={14}/> {s.errors}</span></td>
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
