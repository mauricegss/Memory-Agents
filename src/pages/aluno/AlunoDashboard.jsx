import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Play, Users, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/* eslint-disable react-hooks/exhaustive-deps */

const AlunoDashboard = () => {
  const [classCode, setClassCode] = useState('');
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    if (user) {
      fetchMinhasTurmas();
      fetchMatchCount();
    }
  }, [user]);

  const fetchMinhasTurmas = async () => {
    try {
      setLoading(true);
      const { data: relations } = await supabase
        .from('memory_agents_turma_alunos')
        .select('turma_id')
        .eq('aluno_id', user.id);
        
      if (!relations || relations.length === 0) {
        setTurmas([]);
        return;
      }
      
      const tIds = relations.map(r => r.turma_id);
      
      const { data: turmasData, error } = await supabase
        .from('memory_agents_turmas')
        .select('id, name, code, professor_id')
        .in('id', tIds);
        
      if (error) throw error;
      
      setTurmas(turmasData || []);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error.message);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchCount = async () => {
    try {
      const { count, error } = await supabase
        .from('memory_agents_matches')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', user.id);
      if (!error) setMatchCount(count || 0);
    } catch {
      setMatchCount(0);
    }
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!classCode.trim() || !user) {
      showWarning('Digite o código fornecido pelo seu professor.');
      return;
    }
    try {
      setJoinLoading(true);
      
      const { data: turmaData, error: turmaError } = await supabase
        .from('memory_agents_turmas')
        .select('*')
        .eq('code', classCode.trim())
        .single();
        
      if (turmaError || !turmaData) {
        showError('Turma não encontrada. Verifique o código e tente novamente.');
        return;
      }
      
      const { error: joinError } = await supabase
        .from('memory_agents_turma_alunos')
        .insert([{ turma_id: turmaData.id, aluno_id: user.id }]);
        
      if (joinError && joinError.code !== '23505') { 
         throw joinError;
      }
      
      showSuccess(`Você entrou na turma ${turmaData.name}! 🎉`);
      setClassCode('');
      fetchMinhasTurmas();
      navigate(`/turmas/${turmaData.id}`);
    } catch (error) {
      showError('Erro ao entrar na turma: ' + error.message);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0 space-y-6">
      {/* Banner Principal com Input de Código */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 p-6 sm:p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-200/50">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
            🎓 Painel do Estudante
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-1">Minhas Turmas</h2>
          <p className="text-blue-100 text-sm max-w-md">Entre com o código passado pelo seu professor para acessar atividades e jogos exclusivos.</p>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2 w-full md:w-auto bg-white/15 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
          <div className="relative flex items-center flex-1 md:w-64">
            <KeyRound className="absolute left-3 text-blue-200 pointer-events-none" size={16} />
            <input 
              type="text" 
              placeholder="Código: Ex: MAT6-2026" 
              className="w-full bg-white/95 border-none rounded-xl pl-9 pr-3 py-2.5 text-slate-800 text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-300 transition-all outline-none"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
            disabled={joinLoading}
          >
            {joinLoading ? <Loader2 size={16} className="animate-spin" /> : <>Entrar <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turmas Participadas */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg flex items-center gap-2 text-slate-800">
              <BookOpen size={20} className="text-blue-600" /> Turmas Matriculadas
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-full border border-blue-100">
              {turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
               <div className="sm:col-span-2 text-blue-600 font-bold animate-pulse text-center py-12 bg-white border border-blue-100 rounded-3xl shadow-xs">
                 Carregando suas turmas...
               </div>
            ) : turmas.length === 0 ? (
               <div className="sm:col-span-2 text-center py-10 px-6 bg-white border-2 border-dashed border-blue-200 rounded-3xl shadow-xs">
                 <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   🏫
                 </div>
                 <h4 className="font-black text-slate-700 mb-1 text-base">Você ainda não está em nenhuma turma</h4>
                 <p className="text-slate-400 text-xs max-w-sm mx-auto">Peça o código da turma ao seu professor e digite no campo acima para começar a jogar as atividades da classe.</p>
               </div>
            ) : (
              turmas.map(turma => (
                <Link key={turma.id} to={`/turmas/${turma.id}`} className="block group">
                  <div className="bg-white border-2 border-blue-100 p-5 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all relative overflow-hidden group-hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider">
                        {turma.code || 'TURMA'}
                      </span>
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                        <Play size={14} fill="currentColor" />
                      </div>
                    </div>

                    <h4 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {turma.name}
                    </h4>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users size={14} className="text-blue-500" /> Acessar Sala
                      </span>
                      <span className="text-blue-600 font-extrabold flex items-center gap-0.5">
                        Ver Jogos <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Card de Progresso */}
        <section className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Meu Progresso</h3>
            </div>
            <p className="text-slate-500 text-xs mb-6">Acompanhe seu desempenho e engajamento nas atividades escolares.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center py-5 bg-blue-50/80 rounded-2xl border border-blue-100">
              <span className="text-3xl font-black text-blue-600">{turmas.length}</span>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight mt-1">Turmas Ativas</p>
            </div>
            <div className="text-center py-5 bg-emerald-50/80 rounded-2xl border border-emerald-100">
              <span className="text-3xl font-black text-emerald-600">{matchCount}</span>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight mt-1">Partidas Jogadas</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AlunoDashboard;
