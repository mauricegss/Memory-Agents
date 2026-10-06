import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (sessionUser) => {
    try {
      const userId = sessionUser?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('memory_agents_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) return null;
      if (data) return data;

      // Auto-heal: contas criadas antes do trigger de perfis não têm linha em
      // memory_agents_profiles, o que quebra as policies que usam EXISTS(...).
      const meta = sessionUser.user_metadata || {};
      const role = ['aluno', 'professor'].includes(meta.role) ? meta.role : 'aluno';
      const name = meta.name || (sessionUser.email || 'Usuário').split('@')[0];

      const { data: inserted, error: insertError } = await supabase
        .from('memory_agents_profiles')
        .insert({ id: userId, name, email: sessionUser.email || '', role })
        .select()
        .maybeSingle();

      if (insertError) return null;
      return inserted;
    } catch {
      return null;
    }
  }, []);

  const buildUserFromSession = useCallback((session) => ({
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name || 'Usuário',
    role: session.user.user_metadata?.role || 'aluno',
  }), []);

  useEffect(() => {
    let isMounted = true;

    // Timeout de segurança para nunca travar na tela de loading
    const forceStopTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Timeout de loading atingido, forçando exibição.');
        setLoading(false);
      }
    }, 4000);

    const init = async () => {
      try {
        console.log('[Auth] Inicializando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          console.log('[Auth] Sessão encontrada, buscando perfil...');
          setUser(buildUserFromSession(session)); // Fallback imediato
          
          const profile = await fetchProfile(session.user);
          if (isMounted && profile) {
            setUser(profile);
          }
        } else {
          console.log('[Auth] Nenhuma sessão ativa.');
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Erro na inicialização:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(forceStopTimeout);
      }
    };

    init();

    // === VISIBILITY CHANGE: Refresh ao voltar para a aba ===
    // Previne o problema de expiração (15 minutos) do JWT do Supabase.
    // Como desabilitamos o onAuthStateChange para evitar deadlocks,
    // o refresh proativo ao focar na aba garante que o token estará válido.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !isMounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const expiresAt = session.expires_at * 1000;
        const now = Date.now();
        const remainingMin = Math.round((expiresAt - now) / 60000);
        
        console.log(`[Auth Visibility] Aba ativa. Token expira em ${remainingMin} min.`);
        
        // Se o token expira em menos de 10 minutos, força refresh manual
        if (remainingMin < 10) {
          console.log('[Auth Visibility] Token próximo de expirar, forçando refresh...');
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[Auth Visibility] Refresh falhou:', error.message);
          } else if (data.session) {
            console.log('[Auth Visibility] Sessão renovada com sucesso!');
          }
        }
      } catch (err) {
        console.error('[Auth Visibility] Erro ao verificar sessão:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(forceStopTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, buildUserFromSession, loading]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Atualiza o estado global manualmente já que removemos o onAuthStateChange
    if (data?.session) {
      setUser(buildUserFromSession(data.session));
      const profile = await fetchProfile(data.session.user);
      if (profile) setUser(profile);
    }
    
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut failed, forcing local storage clear:', err);
      localStorage.removeItem('memory-agents-auth');
      for (let key in localStorage) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      }
    } finally {
      setUser(null);
    }
  };

  /**
   * updateProfile — altera nome (tabela profiles), email e/ou senha (auth)
   * @param {{ name?: string, email?: string, password?: string }} updates
   */
  const updateProfile = async ({ name, email, password } = {}) => {
    const authUpdates = {};
    if (email)    authUpdates.email    = email;
    if (password) authUpdates.password = password;

    // 1. Atualizar autenticação (email/senha)
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) throw authError;
    }

    // 2. Atualizar nome na tabela de perfis
    if (name && user?.id) {
      const { error: profileError } = await supabase
        .from('memory_agents_profiles')
        .update({ name })
        .eq('id', user.id);
      if (profileError) throw profileError;
    }

    // 3. Atualizar estado local
    setUser(prev => ({
      ...prev,
      ...(name  ? { name }  : {}),
      ...(email ? { email } : {}),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="bg-blue-600 p-3 rounded-2xl text-white font-black text-3xl animate-pulse shadow-lg">🧠</div>
        <div className="text-blue-400 font-black text-lg animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// O hook é exportado junto ao provider por conveniência do módulo.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
