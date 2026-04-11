import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Play, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const AlunoDashboard = () => {
  const [classCode, setClassCode] = useState('');
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMinhasTurmas();
    }
  }, [user]);

  const fetchMinhasTurmas = async () => {
    try {
      setLoading(true);
      const { data: relations } = await supabase
        .from('turma_alunos')
        .select('turma_id')
        .eq('aluno_id', user.id);
        
      if (!relations || relations.length === 0) {
        setTurmas([]);
        return;
      }
      
      const tIds = relations.map(r => r.turma_id);
      
      const { data: turmasData, error } = await supabase
        .from('turmas')
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

  const handleJoin = async () => {
    if (!classCode.trim() || !user) return;
    try {
      setJoinLoading(true);
      
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('*')
        .eq('code', classCode.trim())
        .single();
        
      if (turmaError || !turmaData) {
        alert('Turma não encontrada. Verifique o código.');
        return;
      }
      
      const { error: joinError } = await supabase
        .from('turma_alunos')
        .insert([{ turma_id: turmaData.id, aluno_id: user.id }]);
        
      if (joinError && joinError.code !== '23505') { 
         throw joinError;
      }
      
      setClassCode('');
      fetchMinhasTurmas();
      navigate(`/turmas/${turmaData.id}`);
    } catch (error) {
      alert('Erro ao entrar na turma: ' + error.message);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-black mb-1">Minhas Turmas</h2>
          <p className="text-indigo-200 text-sm">Entre com o código do seu professor para acessar atividades exclusivas.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto bg-white/10 p-2 rounded-2xl backdrop-blur-sm">
          <input 
            type="text" 
            placeholder="Ex: UTFPR-2026" 
            className="bg-white/80 border-none rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-300 flex-1 transition-all outline-none"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
          />
          <button 
            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50"
            onClick={handleJoin}
            disabled={joinLoading}
          >
            {joinLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-100">
            <BookOpen size={20} className="text-indigo-500" /> Minhas Turmas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
               <div className="sm:col-span-2 text-slate-400 font-medium animate-pulse text-center py-8 bg-slate-900 border border-slate-800 rounded-3xl">
                 Carregando turmas...
               </div>
            ) : turmas.length === 0 ? (
               <div className="sm:col-span-2 text-slate-500 font-medium text-center py-8 px-4 bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
                 Você ainda não participa de nenhuma turma. Insira um código acima!
               </div>
            ) : (
              turmas.map(turma => (
                <Link key={turma.id} to={`/turmas/${turma.id}`} className="block group">
                  <div className="bg-slate-900 border text-center md:text-left border-slate-800 p-6 rounded-3xl hover:border-indigo-500 hover:shadow-lg transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-900/40 transition-colors"></div>
                    <div className="relative z-10">
                      <div className="bg-indigo-900 text-indigo-300 w-max px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-3">Turma</div>
                      <h4 className="text-xl font-black text-slate-100">{turma.name}</h4>
                      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-400">
                          <Users size={16} /> Ver Atividades
                        </div>
                        <div className="bg-slate-800 p-2 rounded-xl text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex justify-center">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-100">
              <Trophy size={20} className="text-amber-500"/> Meu Progresso
            </h3>
            <p className="text-slate-400 text-sm mb-6">Acompanhe seu engajamento nas atividades passadas pelo professor.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center py-6 bg-slate-950 rounded-2xl border border-slate-800/50">
              <span className="text-4xl font-black text-indigo-500">{turmas.length}</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-2">Turmas Ativas</p>
            </div>
            <div className="text-center py-6 bg-slate-950 rounded-2xl border border-slate-800/50">
              <span className="text-4xl font-black text-emerald-500">0</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-2">Relatórios</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AlunoDashboard;