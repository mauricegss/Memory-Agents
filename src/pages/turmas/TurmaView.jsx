import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, BarChart3, Loader2, Plus, X } from 'lucide-react';
import GameCard from '../../components/GameCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const TurmaView = () => {
  const { turmaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [turma, setTurma] = useState(null);
  const [professorName, setProfessorName] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [turmaGames, setTurmaGames] = useState([]);
  
  // States para modal de adicionar jogo
  const [showAddGame, setShowAddGame] = useState(false);
  const [myGames, setMyGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [addingGame, setAddingGame] = useState(false);

  useEffect(() => {
    fetchTurmaData();
  }, [turmaId]);

  const fetchTurmaData = async () => {
    try {
      setLoading(true);
      
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaId)
        .single();
        
      if (turmaError || !turmaData) throw new Error('Turma não encontrada');
      setTurma(turmaData);

      const { data: profData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', turmaData.professor_id)
        .maybeSingle();
      
      setProfessorName(profData?.name || 'Professor(a)');

      const { count } = await supabase
        .from('turma_alunos')
        .select('*', { count: 'exact', head: true })
        .eq('turma_id', turmaId);
        
      setStudentCount(count || 0);

      // Fetch jogos associados à turma
      const { data: relGames } = await supabase
        .from('turma_games')
        .select('games(id, title, likes)')
        .eq('turma_id', turmaId);
        
      if (relGames) {
        setTurmaGames(relGames.map(r => r.games).filter(Boolean));
      }

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

  const fetchProfessorGames = async (profId) => {
     const { data } = await supabase.from('games').select('id, title').eq('author_id', profId);
     if (data) setMyGames(data);
  };

  const handleAddGame = async () => {
     if (!selectedGame) return;
     try {
       setAddingGame(true);
       const { error } = await supabase.from('turma_games').insert([{ turma_id: turma.id, game_id: selectedGame }]);
       if (error && error.code !== '23505') throw error; // ignora duplicados
       
       alert('Jogo adicionado à turma!');
       setShowAddGame(false);
       fetchTurmaData(); // Recarrega para exibir
     } catch (err) {
       alert('Erro ao vincular jogo: ' + err.message);
     } finally {
       setAddingGame(false);
     }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-bold">Carregando turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-slate-900 border border-dashed border-slate-800 p-12 rounded-3xl text-center">
          <h2 className="text-2xl font-black text-slate-100 mb-2">Turma não encontrada</h2>
          <p className="text-slate-400 mb-6">O código ou ID fornecido não corresponde a nenhuma turma ativa.</p>
          <Link to="/" className="text-indigo-400 font-bold hover:underline">Voltar ao Início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Header Estilo Moodle / Roblox Group */}
      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-md shadow-black/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-bold mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar ao Início
        </Link>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-900/50 border border-indigo-800 text-indigo-300 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">{(turma.code || "").split('-')[0] || "TURMA"}</span>
              <span className="flex items-center gap-1 text-slate-400 text-sm font-medium"><Users size={16} /> {studentCount} Aluno{studentCount !== 1 && 's'}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tight">{turma.name}</h1>
            <p className="text-slate-400 mt-2 font-medium">Professor(a): <span className="font-bold text-slate-300">{professorName}</span></p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {user?.role === 'professor' && (
              <button 
                onClick={() => navigate(`/professor/relatorios?turma=${turma.id}`)}
                className="bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all text-sm mb-2 shadow-sm"
              >
                <BarChart3 size={18} /> Ver Relatórios da Turma
              </button>
            )}
            <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
               <div className="bg-amber-900/40 p-3 rounded-xl text-amber-400">
                 <Trophy size={24} />
               </div>
               <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">{user?.role === 'professor' ? 'Média da Turma' : 'Sua Posição'}</p>
                 <p className="text-xl font-black text-slate-100">{user?.role === 'professor' ? '8.5' : '3º Lugar'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Atividades (Jogos) Associadas à Turma */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-100">Atividades da Turma</h2>
          {user?.id === turma.professor_id && (
            <button 
              onClick={() => setShowAddGame(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500 transition-colors shadow-md"
            >
              <Plus size={16} /> Adicionar Jogo
            </button>
          )}
        </div>
        
        {turmaGames.length === 0 ? (
           <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-10 text-center">
             <p className="text-slate-500">Nenhuma atividade disponível nesta turma ainda.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {turmaGames.map((game, i) => (
              <GameCard 
                key={game.id} 
                id={game.id} 
                title={game.title} 
                author={professorName} 
                likes={game.likes} 
                fallbackColor={i % 2 === 0 ? "bg-emerald-600" : "bg-indigo-600"} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Jogo */}
      {showAddGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-100">Vincular Atividade</h3>
              <button onClick={() => setShowAddGame(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            {myGames.length === 0 ? (
              <div className="text-center py-4">
                 <p className="text-slate-400 mb-4">Você ainda não tem nenhum jogo criado.</p>
                 <Link to="/professor/novo-jogo" className="text-indigo-400 font-bold hover:underline">Ir para Criador de Jogos</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-400">Selecione um dos seus jogos:</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 outline-none"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                   <option value="">-- Selecione --</option>
                   {myGames.map(g => (
                     <option key={g.id} value={g.id}>{g.title}</option>
                   ))}
                </select>
                <button 
                  onClick={handleAddGame}
                  disabled={addingGame || !selectedGame}
                  className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {addingGame ? 'Vinculando...' : 'Vincular Jogo'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TurmaView;

