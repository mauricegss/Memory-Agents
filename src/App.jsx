import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PrivateRoute } from './routes/PrivateRoutes';
import { LayoutGrid, GraduationCap, Users, LogOut, ChevronDown, Sparkles } from 'lucide-react';

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
import ProfileModal from './components/ProfileModal';

/* ═══════════════════════════════════════════════
   NAVBAR — Tema claro, infantil & educacional
   ═══════════════════════════════════════════════ */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  const roleConfig = {
    professor: { label: 'Professor', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '👨‍🏫' },
    aluno:     { label: 'Aluno',     color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: '🎓' },
  };
  const role = roleConfig[user?.role] ?? { label: user?.role ?? '', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '👤' };

  const isCurrentRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-blue-100/80 px-4 sm:px-6 py-3 flex justify-between items-center shadow-xs flex-shrink-0 z-50">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
            🧠
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-slate-800 leading-tight hidden sm:block tracking-tight">
              Memory<span className="text-blue-600">Agents</span>
            </span>
            <span className="text-[10px] font-bold text-blue-500 hidden sm:block uppercase tracking-wider">
              Plataforma Educacional
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-sm transition-all ${
              isCurrentRoute('/') && !location.pathname.startsWith('/aluno') && !location.pathname.startsWith('/professor')
                ? 'bg-blue-50 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={17} />
            <span>Explorar</span>
          </Link>

          {user?.role === 'aluno' && (
            <Link
              to="/aluno"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-sm transition-all ${
                isCurrentRoute('/aluno')
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <GraduationCap size={17} />
              <span>Minhas Turmas</span>
            </Link>
          )}

          {user?.role === 'professor' && (
            <Link
              to="/professor"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-sm transition-all ${
                isCurrentRoute('/professor')
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Users size={17} />
              <span>Painel do Professor</span>
            </Link>
          )}
        </div>

        {/* User area */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(s => !s)}
              className="flex items-center gap-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-2xl px-3 py-1.5 transition-all shadow-xs cursor-pointer"
            >
              {/* Avatar inicial */}
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-black text-slate-700">{user.name || 'Usuário'}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${role.color}`}>
                  {role.icon} {role.label}
                </span>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-blue-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-blue-50/50 border-b border-blue-100">
                  <p className="text-xs font-bold text-slate-500">Conectado como</p>
                  <p className="text-sm font-black text-slate-800 truncate">{user.name || user.email}</p>
                </div>
                <button
                  onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
                >
                  <span className="text-base">⚙️</span> Configurar Perfil
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={16} /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="btn-primary px-4 py-2 text-sm rounded-xl"
            >
              Entrar
            </Link>
            <Link
              to="/auth/register"
              className="btn-secondary px-4 py-2 text-sm rounded-xl hidden sm:inline-flex"
            >
              Cadastrar
            </Link>
          </div>
        )}
      </nav>

      {/* Fechar dropdown ao clicar fora */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}

      {/* Modal de perfil */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
};

/* ═══════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════ */
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          {/* h-screen overflow-hidden → layout 100% responsivo e sem scroll da janela global */}
          <div className="h-screen text-slate-700 flex flex-col font-sans overflow-hidden bg-transparent">
            <Navbar />
            <main className="flex-1 overflow-hidden page-transition">
              <div className="container mx-auto px-4 sm:px-6 py-4 h-full flex flex-col">
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/login"         element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route path="/"              element={<DashboardHub />} />

                  {/* Rotas Protegidas (qualquer login) */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/play/:gameId"      element={<GameArena />} />
                    <Route path="/turmas/:turmaId"   element={<TurmaView />} />
                  </Route>

                  {/* Apenas Aluno */}
                  <Route element={<PrivateRoute allowedRoles={['aluno']} />}>
                    <Route path="/aluno" element={<AlunoDashboard />} />
                  </Route>

                  {/* Apenas Professor */}
                  <Route element={<PrivateRoute allowedRoles={['professor']} />}>
                    <Route path="/professor"                element={<ProfessorDashboard />} />
                    <Route path="/professor/novo-jogo"      element={<Configurator />} />
                    <Route path="/professor/relatorios"     element={<GameReports />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
