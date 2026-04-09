import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './routes/PrivateRoutes';
import { User, LogOut, LayoutGrid, GraduationCap, Users } from 'lucide-react';

// Páginas
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardHub from './pages/DashboardHub';

import GameArena from './pages/play/GameArena';
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import Configurator from './pages/professor/Configurator';
import GameReports from './pages/professor/GameReports';
import AlunoDashboard from './pages/aluno/AlunoDashboard';
import TurmaView from './pages/turmas/TurmaView';

// Componente de Barra de Navegação (Estilo Platform)
// Componente de Barra de Navegação (Estilo Platform)
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg text-white font-black text-xl italic drop-shadow-md">M</div>
        <span className="font-black text-xl tracking-tighter text-slate-100 uppercase">Memory<span className="text-indigo-500">Agents</span></span>
      </Link>
      
      <div className="flex items-center gap-6">
        <Link to="/" className="text-slate-400 hover:text-indigo-400 font-bold text-sm flex items-center gap-1 transition-colors">
          <LayoutGrid size={18} /> Explorar
        </Link>
        {user?.role === 'aluno' && (
          <Link to="/aluno" className="text-slate-400 hover:text-indigo-400 font-bold text-sm flex items-center gap-1 transition-colors">
            <GraduationCap size={18} /> Sou Aluno
          </Link>
        )}
        {user?.role === 'professor' && (
          <Link to="/professor" className="text-slate-400 hover:text-indigo-400 font-bold text-sm flex items-center gap-1 transition-colors">
            <Users size={18} /> Sou Professor
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-4 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                {user?.name ? user.name[0] : '?'}
              </div>
              <span className="text-sm font-bold text-slate-200">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 container mx-auto px-6 py-8 page-transition">
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/" element={<DashboardHub />} />
              
              {/* Rotas Protegidas (Geral: Requer qualquer Login) */}
              <Route element={<PrivateRoute />}>
                <Route path="/play/:gameId" element={<GameArena />} />
                <Route path="/turmas/:turmaId" element={<TurmaView />} />
              </Route>

              {/* Rotas Protegidas (Apenas Aluno) */}
              <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
                <Route path="/aluno" element={<AlunoDashboard />} />
              </Route>

              {/* Rotas Protegidas (Apenas Professor) */}
              <Route element={<PrivateRoute allowedRoles={['professor']} />}>
                <Route path="/professor" element={<ProfessorDashboard />} />
                <Route path="/professor/novo-jogo" element={<Configurator />} />
                <Route path="/professor/relatorios" element={<GameReports />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;