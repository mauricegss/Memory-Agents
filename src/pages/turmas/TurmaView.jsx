import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, BarChart3, Loader2, Plus, X, Trash2, ArrowLeft, Gamepad2, GraduationCap } from 'lucide-react';
import GameCard from '../../components/GameCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

const TurmaView = () => {
  const { turmaId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [turma, setTurma] = useState(null);
  const [professorName, setProfessorName] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [turmaGames, setTurmaGames] = useState([]);
  
  const [activeTab, setActiveTab] = useState('atividades');
  const [alunosList, setAlunosList] = useState([]);
  
  // States para modal de adicionar jogo
  const [showAddGame, setShowAddGame] = useState(false);
  const [myGames, setMyGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [addingGame, setAddingGame] = useState(false);
  const [turmaStats, setTurmaStats] = useState({ avgScore: null, playerRank: null, totalMatches: 0 });

  // State para confirmação de remoção de aluno
  const [studentToRemove, setStudentToRemove] = useState(null);

  useEffect(() => {
    fetchTurmaData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  const fetchTurmaData = async () => {
    try {
      setLoading(true);
      
      const { data: turmaData, error: turmaError } = await supabase
        .from('memory_agents_turmas')
        .select('*')
        .eq('id', turmaId)
        .single();
        
      if (turmaError || !turmaData) throw new Error('Turma não encontrada');
      setTurma(turmaData);

      const { data: profData } = await supabase
        .from('memory_agents_profiles')
        .select('name')
        .eq('id', turmaData.professor_id)
        .maybeSingle();
      
      setProfessorName(profData?.name || 'Professor(a)');

      // Alunos vinculados
      const { data: relAlunosData } = await supabase
        .from('memory_agents_turma_alunos')
        .select('aluno_id')
        .eq('turma_id', turmaId);

      if (relAlunosData && relAlunosData.length > 0) {
        const studentIds = relAlunosData.map(a => a.aluno_id);
        const { data: profsData } = await supabase
           .from('memory_agents_profiles')
           .select('id, name, email')
           .in('id', studentIds);
           
        setAlunosList(profsData || []);
        setStudentCount(profsData?.length || 0);
      } else {
        setAlunosList([]);
        setStudentCount(0);
      }

      // Fetch jogos associados à turma
      const { data: relGamesData } = await supabase
        .from('memory_agents_turma_games')
        .select('game_id')
        .eq('turma_id', turmaId);
        
      if (relGamesData && relGamesData.length > 0) {
        const gameIds = relGamesData.map(r => r.game_id);
        const { data: gamesData } = await supabase
           .from('memory_agents_games')
           .select('*')
           .in('id', gameIds);
           
        setTurmaGames(gamesData || []);
      } else {
        setTurmaGames([]);
      }

      // Busca estatísticas reais da turma
      await fetchTurmaStats();

      // Se for o criador da turma, busca os jogos dele para o modal de adicionar jogo
      if (user?.id === turmaData.professor_id) {
         fetchProfessorGames(user.id);
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados da turma:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTurmaStats = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('memory_agents_matches')
        .select('player_id, player_score')
        .eq('turma_id', turmaId);

      if (error || !matches || matches.length === 0) {
        setTurmaStats({ avgScore: null, playerRank: null, totalMatches: 0 });
        return;
      }

      // Média geral (para professor)
      const avgScore = (matches.reduce((sum, m) => sum + (m.player_score || 0), 0) / matches.length).toFixed(1);

      // Ranking do aluno (para aluno)
      let playerRank = null;
      if (user && user.role === 'aluno') {
        const scoresByPlayer = {};
        matches.forEach(m => {
          scoresByPlayer[m.player_id] = (scoresByPlayer[m.player_id] || 0) + (m.player_score || 0);
        });
        const ranked = Object.entries(scoresByPlayer)
          .sort(([, a], [, b]) => b - a)
          .map(([id]) => id);
        const idx = ranked.indexOf(user.id);
        playerRank = idx >= 0 ? idx + 1 : null;
      }

      setTurmaStats({ avgScore, playerRank, totalMatches: matches.length });
    } catch {
      setTurmaStats({ avgScore: null, playerRank: null, totalMatches: 0 });
    }
  };

  const fetchProfessorGames = async (profId) => {
     const { data } = await supabase.from('memory_agents_games').select('id, title').eq('author_id', profId);
     if (data) setMyGames(data);
  };

  const handleAddGame = async () => {
     if (!selectedGame) return;
     try {
       setAddingGame(true);
       const { error } = await supabase.from('memory_agents_turma_games').insert([{ turma_id: turma.id, game_id: selectedGame }]);
       if (error && error.code !== '23505') throw error; // ignora duplicados
       
       showSuccess('Jogo adicionado à turma com sucesso! 🎮');
       setShowAddGame(false);
       setSelectedGame('');
       fetchTurmaData();
     } catch (err) {
       showError('Erro ao vincular jogo: ' + err.message);
     } finally {
       setAddingGame(false);
     }
  };

  const handleConfirmRemoveStudent = async () => {
     if (!studentToRemove) return;
     try {
       const { error } = await supabase.from('memory_agents_turma_alunos').delete().eq('turma_id', turma.id).eq('aluno_id', studentToRemove.id);
       if (error) throw error;
       
       setAlunosList(alunosList.filter(a => a.id !== studentToRemove.id));
       setStudentCount(prev => prev - 1);
       showSuccess(`Aluno "${studentToRemove.name}" removido da turma.`);
       setStudentToRemove(null);
     } catch (err) {
       showError('Erro ao remover aluno: ' + err.message);
     }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="text-blue-500 font-black text-sm">Carregando dados da turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <div className="bg-white border-2 border-dashed border-blue-200 p-10 rounded-3xl text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Turma não encontrada</h2>
          <p className="text-slate-500 text-sm mb-6">O código ou ID fornecido não corresponde a nenhuma turma ativa.</p>
          <Link to="/" className="btn-primary py-2.5 px-5 text-sm">Voltar ao Início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0 space-y-6">
      {/* Header Estilo Card Educacional */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <Link to={user?.role === 'professor' ? '/professor' : '/aluno'} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
            <ChevronLeft size={18} /> Voltar ao Painel
          </Link>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
            Código: {turma.code || "TURMA"}
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
              <GraduationCap size={16} className="text-blue-500" />
              <span>Professor(a): <strong className="text-slate-700">{professorName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Users size={14} /> {studentCount} Aluno{studentCount !== 1 && 's'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">{turma.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'professor' && user?.id === turma.professor_id && (
              <button 
                onClick={() => navigate(`/professor/relatorios?turma=${turma.id}`)}
                className="btn-secondary py-2.5 px-4 text-xs font-black flex items-center gap-2"
              >
                <BarChart3 size={16} /> Relatórios da Turma
              </button>
            )}

            <div className="flex items-center gap-3 bg-blue-50/80 px-4 py-2.5 rounded-2xl border border-blue-100">
               <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                 <Trophy size={20} />
               </div>
               <div>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{user?.role === 'professor' ? 'Média da Turma' : 'Sua Posição'}</p>
                 <p className="text-lg font-black text-slate-800">
                   {user?.role === 'professor'
                     ? (turmaStats.avgScore !== null ? `${turmaStats.avgScore} pts` : '—')
                     : (turmaStats.playerRank !== null ? `${turmaStats.playerRank}º Lugar` : '—')}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="space-y-4">
        <div className="flex bg-white border border-blue-100 rounded-2xl p-1 max-w-fit shadow-xs">
           <button 
             onClick={() => setActiveTab('atividades')}
             className={`px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
               activeTab === 'atividades' 
                 ? 'bg-blue-600 text-white shadow-xs' 
                 : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
             }`}
           >
             🎮 Atividades ({turmaGames.length})
           </button>
           {user?.role === 'professor' && user?.id === turma.professor_id && (
             <button 
               onClick={() => setActiveTab('alunos')}
               className={`px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                 activeTab === 'alunos' 
                   ? 'bg-blue-600 text-white shadow-xs' 
                   : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
               }`}
             >
               👥 Alunos Matriculados ({studentCount})
             </button>
           )}
        </div>

        {activeTab === 'atividades' ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Gamepad2 className="text-blue-600" size={20} /> Jogos da Turma
              </h2>
              {user?.id === turma.professor_id && (
                <button 
                  onClick={() => setShowAddGame(true)}
                  className="btn-primary py-2 px-4 text-xs font-black flex items-center gap-1.5"
                >
                  <Plus size={16} /> Adicionar Jogo
                </button>
              )}
            </div>
            
            {turmaGames.length === 0 ? (
               <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-10 text-center shadow-xs">
                 <p className="text-slate-500 font-bold text-sm">Nenhuma atividade vinculada a esta turma ainda.</p>
                 {user?.id === turma.professor_id && (
                   <button 
                     onClick={() => setShowAddGame(true)}
                     className="btn-secondary py-2 px-4 text-xs font-black mt-3"
                   >
                     Vincular um Jogo Agora
                   </button>
                 )}
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {turmaGames.map((game, i) => (
                  <GameCard 
                    key={game.id} 
                    id={game.id} 
                    title={game.title} 
                    author={professorName} 
                    completions={game.plays || 0} 
                    imageUrl={game.thumbnail_url}
                    fallbackColor={i % 3 === 0 ? "bg-blue-500" : i % 3 === 1 ? "bg-indigo-500" : "bg-sky-500"} 
                    turmaId={turmaId}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-blue-100 rounded-3xl shadow-sm overflow-hidden">
             <div className="p-5 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
               <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                 <Users className="text-blue-600" size={18} /> Lista de Estudantes
               </h3>
               <span className="bg-white text-blue-600 border border-blue-200 px-3 py-0.5 rounded-full text-xs font-black">
                 {studentCount} Aluno(s)
               </span>
             </div>

             {alunosList.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium text-sm">
                  Nenhum aluno entrou nesta turma ainda. Compartilhe o código <strong>{turma.code}</strong> com a turma!
                </div>
             ) : (
                <ul className="divide-y divide-blue-50">
                  {alunosList.map(aluno => (
                    <li key={aluno.id} className="p-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black uppercase text-sm shadow-xs">
                            {aluno.name ? aluno.name[0] : '?'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{aluno.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{aluno.email}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setStudentToRemove(aluno)}
                         className="text-xs font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                       >
                         <Trash2 size={14} /> Remover
                       </button>
                    </li>
                  ))}
                </ul>
             )}
          </div>
        )}
      </div>

      {/* Modal Adicionar Jogo */}
      {showAddGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-blue-100 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-black text-slate-800">Vincular Jogo à Turma</h3>
              <button onClick={() => setShowAddGame(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X size={20} />
              </button>
            </div>
            {myGames.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                 <p className="text-slate-500 font-medium text-sm">Você ainda não tem nenhum jogo criado.</p>
                 <Link to="/professor/novo-jogo" className="btn-primary py-2.5 px-4 text-xs font-black inline-block">
                   Criar Meu Primeiro Jogo
                 </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    Selecione o Jogo:
                  </label>
                  <select 
                    className="input-field"
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                  >
                     <option value="">-- Escolha um jogo --</option>
                     {myGames.map(g => (
                       <option key={g.id} value={g.id}>{g.title}</option>
                     ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddGame(false)}
                    className="btn-secondary flex-1 py-3 text-sm font-black"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddGame}
                    disabled={addingGame || !selectedGame}
                    className="btn-primary flex-1 py-3 text-sm font-black"
                  >
                    {addingGame ? 'Vinculando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de remoção de aluno */}
      {studentToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-rose-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Remover Aluno?</h3>
            <p className="text-slate-500 text-xs mb-5">
              Tem certeza que deseja remover <strong>{studentToRemove.name}</strong> desta turma? O aluno perderá acesso às atividades.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStudentToRemove(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-black"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRemoveStudent}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 px-4 rounded-2xl text-xs flex-1 transition-all"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurmaView;
