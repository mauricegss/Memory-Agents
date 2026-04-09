import React, { useState, useEffect } from 'react';
import { Plus, Users, Library, BarChart3, Settings, Copy, Check, X, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GameCard from '../../components/GameCard';

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('turmas'); // 'turmas' | 'jogos'
  const [turmas, setTurmas] = useState([]);
  const [myGames, setMyGames] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [newTurma, setNewTurma] = useState({ name: '', code: '' });

  useEffect(() => {
    if (user) {
      if (activeTab === 'turmas') {
         fetchTurmas();
      } else {
         fetchMyGames();
      }
    }
  }, [user, activeTab]);

  const fetchTurmas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('turmas')
        .select('*, turma_alunos(count), turma_games(count)')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error('Error fetching turmas:', error.message);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error.message);
      setMyGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTurma = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('turmas')
        .insert([
          { 
            name: newTurma.name, 
            code: newTurma.code, 
            professor_id: user.id 
          }
        ])
        .select();

      if (error) throw error;
      
      setTurmas([data[0], ...turmas]);
      setShowModal(false);
      setNewTurma({ name: '', code: '' });
    } catch (error) {
      alert('Erro ao criar turma: ' + error.message);
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto py-6">
      {/* Sidebar de Ações Rápidas */}
      <aside className="lg:col-span-1 space-y-4">
        <button 
          onClick={() => navigate('/professor/novo-jogo')}
          className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={20} /> Criar Novo Jogo
        </button>
        
        <nav className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-slate-400 font-medium">
          <button 
            onClick={() => setActiveTab('turmas')}
            className={`w-full p-4 flex items-center gap-3 transition-colors ${activeTab === 'turmas' ? 'bg-slate-800 text-indigo-400 border-b border-slate-800 font-bold' : 'hover:bg-slate-800'}`}
          >
            <Users size={18} /> Painel de Turmas
          </button>
          <button 
            onClick={() => setActiveTab('jogos')}
            className={`w-full p-4 flex items-center gap-3 transition-colors ${activeTab === 'jogos' ? 'bg-slate-800 text-indigo-400 font-bold' : 'hover:bg-slate-800'}`}
          >
            <Library size={18} /> Meus Jogos
          </button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="lg:col-span-3 space-y-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black mb-2">Painel do Professor</h2>
            <p className="text-emerald-100">Gerencie suas turmas, alunos e crie atividades engajadoras.</p>
          </div>
          <div className="hidden md:block opacity-20">
            <Users size={80} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-100">{activeTab === 'turmas' ? 'Minhas Turmas' : 'Meus Jogos Criados'}</h3>
          {activeTab === 'turmas' && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-slate-900 border border-slate-800 text-indigo-400 px-4 py-2 rounded-xl font-bold hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus size={16} /> Nova Turma
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 min-h-[30vh]">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : activeTab === 'turmas' ? (
           turmas.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-12 text-center mt-6">
               <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Users size={32} />
               </div>
               <h4 className="text-slate-300 font-bold mb-1">Você ainda não tem turmas</h4>
               <p className="text-slate-500 text-sm mb-6">Comece agora criando sua primeira turma para gerenciar alunos.</p>
               <button 
                 onClick={() => setShowModal(true)}
                 className="text-indigo-400 font-bold hover:underline"
                >
                  + Criar minha primeira turma
                </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {turmas.map(turma => (
                <div key={turma.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-indigo-900/50 text-indigo-300 font-black text-xs px-3 py-1 rounded-lg tracking-wider uppercase">
                      {turma.code.split('-')[0] || 'CLASS'}
                    </span>
                    <button 
                      onClick={() => alert(`Configurando a turma: ${turma.name}`)}
                      className="text-slate-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Settings size={18}/>
                    </button>
                  </div>
                  <Link to={`/turmas/${turma.id}`} className="block">
                    <h4 className="text-xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {turma.name}
                    </h4>
                  </Link>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Users size={16}/> {turma.turma_alunos?.[0]?.count || 0} Alunos</span>
                      <span className="flex items-center gap-1"><Library size={16}/> {turma.turma_games?.[0]?.count || 0} Jogos</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                    <span className="flex items-center gap-1">Código: <b className="text-slate-300">{turma.code}</b></span>
                    <div className="flex gap-4">
                      <Link 
                        to={`/professor/relatorios?turma=${turma.id}`}
                        className="text-indigo-400 font-bold hover:underline" 
                      >
                        Relatórios
                      </Link>
                      <button 
                        onClick={() => handleCopyCode(turma.code, turma.id)}
                        className="flex items-center gap-1 text-indigo-400 font-bold hover:underline"
                      >
                        {copiedId === turma.id ? (
                          <> <Check size={14} className="text-emerald-400" /> Copiado! </>
                        ) : (
                          <> <Copy size={14} /> Copiar </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* JOGOS TAB */
          myGames.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-12 text-center mt-6">
               <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Library size={32} />
               </div>
               <h4 className="text-slate-300 font-bold mb-1">Você não tem jogos criados</h4>
               <p className="text-slate-500 text-sm mb-6">Crie seu primeiro desafio interativo com auxílio de IA.</p>
               <button 
                 onClick={() => navigate('/professor/novo-jogo')}
                 className="text-indigo-400 font-bold hover:underline"
                >
                  + Criar Novo Jogo
                </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
               {myGames.map((game, i) => (
                  <GameCard 
                    key={game.id} 
                    id={game.id} 
                    title={game.title} 
                    author="Você" 
                    likes={game.likes} 
                    fallbackColor={i % 2 === 0 ? "bg-indigo-600" : "bg-purple-600"} 
                  />
               ))}
            </div>
          )
        )}

        {/* Modal de Criação de Turma */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-100 italic">Nova Turma</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateTurma} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome da Turma</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Matemática - 6º Ano A" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    value={newTurma.name}
                    onChange={(e) => setNewTurma({...newTurma, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Código Identificador</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: MAT6-2026" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    value={newTurma.code}
                    onChange={(e) => setNewTurma({...newTurma, code: e.target.value})}
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20"
                  >
                    Criar Turma
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ProfessorDashboard;