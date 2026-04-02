import React from 'react';
import { Plus, Users, Library, BarChart3, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const ProfessorDashboard = () => {
  const navigate = useNavigate();

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
          <button className="w-full p-4 flex items-center gap-3 bg-slate-800 text-indigo-400 border-b border-slate-800 font-bold">
            <Users size={18} /> Painel de Turmas
          </button>
          <button onClick={() => alert('Em desenvolvimento! Em breve você poderá ver seus jogos aqui.')} className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors border-b border-slate-800">
            <Library size={18} /> Meus Jogos
          </button>
          <button onClick={() => alert('Em desenvolvimento! Relatórios estarão disponíveis em breve.')} className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors">
            <BarChart3 size={18} /> Relatórios
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
          <h3 className="text-2xl font-bold text-slate-100">Minhas Turmas</h3>
          <button className="bg-slate-900 border border-slate-800 text-indigo-400 px-4 py-2 rounded-xl font-bold hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Plus size={16} /> Nova Turma
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Turma 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-indigo-900/50 text-indigo-300 font-black text-xs px-3 py-1 rounded-lg tracking-wider">MAT-6A</span>
              <button className="text-slate-500 hover:text-slate-300"><Settings size={18}/></button>
            </div>
            <Link to="/turmas/123" className="block">
              <h4 className="text-xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">Matemática do 6º Ano</h4>
            </Link>
            <div className="mt-6 flex items-center justify-between text-sm">
              <div className="flex gap-4 text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Users size={16}/> 32 Alunos</span>
                <span className="flex items-center gap-1"><Library size={16}/> 4 Jogos</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
               <span>Código Moodle: <b className="text-slate-300">UTFPR-MAT6</b></span>
               <button className="text-indigo-400 font-bold hover:underline">Copiar</button>
            </div>
          </div>

          {/* Turma 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-emerald-900/50 text-emerald-400 font-black text-xs px-3 py-1 rounded-lg tracking-wider">CIE-8B</span>
              <button className="text-slate-500 hover:text-slate-300"><Settings size={18}/></button>
            </div>
            <Link to="/turmas/456" className="block">
              <h4 className="text-xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">Ciências da Natureza</h4>
            </Link>
            <div className="mt-6 flex items-center justify-between text-sm">
              <div className="flex gap-4 text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Users size={16}/> 28 Alunos</span>
                <span className="flex items-center gap-1"><Library size={16}/> 2 Jogos</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
               <span>Código Moodle: <b className="text-slate-300">UTFPR-CIE8</b></span>
               <button className="text-indigo-400 font-bold hover:underline">Copiar</button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ProfessorDashboard;