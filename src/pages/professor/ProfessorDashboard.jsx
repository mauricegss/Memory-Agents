import React, { useState, useEffect } from 'react';
import { Plus, Users, Library, BarChart3, Settings, Copy, Check, X, Loader2, Sparkles, GraduationCap, Gamepad2, ArrowRight, Trash2, Edit3, Dices } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import GameCard from '../../components/GameCard';

/* eslint-disable react-hooks/exhaustive-deps */

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('turmas'); // 'turmas' | 'jogos'
  const [turmas, setTurmas] = useState([]);
  const [myGames, setMyGames] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [newTurma, setNewTurma] = useState({ name: '', code: '' });
  const [editingTurma, setEditingTurma] = useState(null);
  const [turmaToDelete, setTurmaToDelete] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchTurmas(), fetchMyGames()]).finally(() => setLoading(false));
  }, [user]);

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_agents_turmas')
        .select('*')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const turmasFormatadas = await Promise.all((data || []).map(async (t) => {
          const { count: alunosCount } = await supabase
            .from('memory_agents_turma_alunos')
            .select('*', { count: 'exact', head: true })
            .eq('turma_id', t.id);
            
          const { count: gamesCount } = await supabase
            .from('memory_agents_turma_games')
            .select('*', { count: 'exact', head: true })
            .eq('turma_id', t.id);

          return {
            ...t,
            turma_alunos: [{ count: alunosCount || 0 }],
            turma_games: [{ count: gamesCount || 0 }]
          };
      }));
      
      setTurmas(turmasFormatadas);
    } catch (error) {
      console.error('Error fetching turmas:', error.message);
      setTurmas([]);
    }
  };

  const fetchMyGames = async () => {
    try {
      const { data, error } = await supabase
        .from('memory_agents_games')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error.message);
      setMyGames([]);
    }
  };

  const generateAutoCode = () => {
    const prefix = (newTurma.name || 'TURMA').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'TUR');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setNewTurma(prev => ({ ...prev, code: `${prefix}-${randomNum}` }));
  };

  const handleCreateTurma = async (e) => {
    e.preventDefault();
    if (!newTurma.name.trim() || !newTurma.code.trim()) {
      showError('Preencha o nome e o código identificador da turma.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('memory_agents_turmas')
        .insert([
          { 
            name: newTurma.name, 
            code: newTurma.code.toUpperCase().trim(), 
            professor_id: user.id 
          }
        ])
        .select();

      if (error) throw error;
      
      setTurmas([data[0], ...turmas]);
      setShowModal(false);
      setNewTurma({ name: '', code: '' });
      showSuccess(`Turma "${data[0].name}" criada com sucesso! 🏫`);
    } catch (error) {
      showError('Erro ao criar turma: ' + error.message);
    }
  };

  const handleEditTurma = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('memory_agents_turmas')
        .update({ name: editingTurma.name, code: editingTurma.code.toUpperCase().trim() })
        .eq('id', editingTurma.id)
        .select();

      if (error) throw error;
      
      setTurmas(turmas.map(t => t.id === editingTurma.id ? { ...t, ...data[0] } : t));
      setEditingTurma(null);
      showSuccess('Turma atualizada com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar turma: ' + error.message);
    }
  };

  const handleDeleteTurma = async () => {
    if (!turmaToDelete) return;
    try {
      try {
         await supabase.from('memory_agents_turma_alunos').delete().eq('turma_id', turmaToDelete.id);
         await supabase.from('memory_agents_turma_games').delete().eq('turma_id', turmaToDelete.id);
      } catch {
         // Silently ignore relation cleanups if not present
      }

      const { error } = await supabase.from('memory_agents_turmas').delete().eq('id', turmaToDelete.id);
      if (error) throw error;
      
      setTurmas(turmas.filter(t => t.id !== turmaToDelete.id));
      setTurmaToDelete(null);
      setEditingTurma(null);
      showSuccess('Turma excluída com sucesso.');
    } catch (error) {
      showError('Erro ao excluir turma: ' + error.message);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showInfo(`Código ${code} copiado!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalAlunos = turmas.reduce((acc, t) => acc + (t.turma_alunos?.[0]?.count || 0), 0);

  return (
    <div className="flex-1 overflow-auto scrollbar-thin min-h-0 space-y-6">
      {/* Banner Superior com Estatísticas */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
            👨‍🏫 Gestão Educacional
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">Painel do Professor</h1>
          <p className="text-blue-100 text-sm max-w-md">Gerencie suas turmas, crie jogos personalizados com IA e analise o rendimento dos seus alunos.</p>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto bg-white/15 p-2 rounded-2xl backdrop-blur-md border border-white/20">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-black text-white">{turmas.length}</span>
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter">Turmas</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-black text-white">{myGames.length}</span>
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter">Jogos</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <span className="text-2xl font-black text-white">{totalAlunos}</span>
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter">Alunos</p>
          </div>
        </div>
      </div>

      {/* Navegação de Abas e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-blue-100/80 pb-3">
        <div className="flex bg-white border border-blue-100 rounded-2xl p-1 shadow-xs">
          <button
            onClick={() => setActiveTab('turmas')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'turmas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Users size={16} /> Minhas Turmas ({turmas.length})
          </button>
          <button
            onClick={() => setActiveTab('jogos')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'jogos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Library size={16} /> Meus Jogos ({myGames.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'turmas' ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} /> Nova Turma
            </button>
          ) : (
            <Link
              to="/professor/novo-jogo"
              className="btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-1.5"
            >
              <Sparkles size={16} /> Criar Novo Jogo
            </Link>
          )}

          <Link
            to="/professor/relatorios"
            className="btn-secondary py-2.5 px-4 text-xs font-black flex items-center gap-1.5"
          >
            <BarChart3 size={16} /> Relatórios Globais
          </Link>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-blue-500 font-black text-sm">Carregando painel...</p>
        </div>
      ) : activeTab === 'turmas' ? (
        <div>
          {turmas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                🏫
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Nenhuma turma criada ainda</h3>
              <p className="text-slate-400 text-xs mb-5">Crie sua primeira turma para gerar um código e convidar seus alunos para os desafios com IA.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary py-2.5 px-5 text-xs font-black"
              >
                + Criar Minha Primeira Turma
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {turmas.map((turma) => (
                <div
                  key={turma.id}
                  className="bg-white border-2 border-blue-100 rounded-3xl p-5 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <button
                        onClick={() => copyToClipboard(turma.code, turma.id)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Clique para copiar o código"
                      >
                        {copiedId === turma.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{turma.code}</span>
                      </button>

                      <button
                        onClick={() => setEditingTurma(turma)}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Configurar Turma"
                      >
                        <Settings size={16} />
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
                      {turma.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-4">
                      <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Users size={14} className="text-blue-500" />
                        {turma.turma_alunos?.[0]?.count || 0} alunos
                      </span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Gamepad2 size={14} className="text-indigo-500" />
                        {turma.turma_games?.[0]?.count || 0} jogos
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <Link
                      to={`/turmas/${turma.id}`}
                      className="btn-primary py-2 px-3 text-xs font-black flex-1 text-center justify-center"
                    >
                      Acessar Turma <ArrowRight size={14} />
                    </Link>
                    <Link
                      to={`/professor/relatorios?turma=${turma.id}`}
                      className="btn-secondary py-2 px-3 text-xs font-black flex items-center justify-center text-slate-600"
                      title="Relatórios"
                    >
                      <BarChart3 size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {myGames.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                🎮
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Você ainda não criou jogos</h3>
              <p className="text-slate-400 text-xs mb-5">Crie jogos da memória com temas personalizados, cartas com texto ou imagens e inteligência artificial.</p>
              <Link
                to="/professor/novo-jogo"
                className="btn-primary py-2.5 px-5 text-xs font-black inline-block"
              >
                ✨ Criar Meu Primeiro Jogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myGames.map((game, i) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  author={user.name || 'Você'}
                  authorId={user.id}
                  completions={game.plays || 0}
                  imageUrl={game.thumbnail_url}
                  fallbackColor={i % 3 === 0 ? 'bg-blue-500' : i % 3 === 1 ? 'bg-indigo-500' : 'bg-sky-500'}
                  onEdit={() => navigate(`/professor/jogo/${game.id}/editar`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Nova Turma */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-blue-100 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Nova Turma</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTurma} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 ml-1">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  placeholder="Ex: 6º Ano A — Robótica e Matemática"
                  value={newTurma.name}
                  onChange={(e) => setNewTurma({ ...newTurma, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Código de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={generateAutoCode}
                    className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Dices size={13} /> Gerar Automático
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ex: MAT6-A-2026"
                  value={newTurma.code}
                  onChange={(e) => setNewTurma({ ...newTurma, code: e.target.value })}
                  className="input-field font-mono font-bold uppercase"
                  required
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1 ml-1">
                  Este é o código que você entregará aos alunos para eles entrarem na turma.
                </p>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-3 text-sm font-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 text-sm font-black"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Turma */}
      {editingTurma && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-blue-100 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-black text-slate-800">Configurações da Turma</h3>
              <button onClick={() => setEditingTurma(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditTurma} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 ml-1">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  value={editingTurma.name}
                  onChange={(e) => setEditingTurma({ ...editingTurma, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 ml-1">
                  Código de Acesso
                </label>
                <input
                  type="text"
                  value={editingTurma.code}
                  onChange={(e) => setEditingTurma({ ...editingTurma, code: e.target.value })}
                  className="input-field font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTurmaToDelete(editingTurma)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={15} /> Excluir
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 text-sm font-black"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação para exclusão de turma */}
      {turmaToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-rose-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Excluir Turma?</h3>
            <p className="text-slate-500 text-xs mb-5">
              Tem certeza que deseja excluir <strong>{turmaToDelete.name}</strong>? Esta ação é irreversível e os alunos perderão o acesso.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTurmaToDelete(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-black"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTurma}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 px-4 rounded-2xl text-xs flex-1 transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;
