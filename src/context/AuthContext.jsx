import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('memory_agents_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) return null;
      return data;
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
          
          const profile = await fetchProfile(session.user.id);
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
      const profile = await fetchProfile(data.session.user.id);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="bg-indigo-600 p-2 rounded-xl text-white font-black text-2xl animate-pulse">M</div>
        <div className="text-slate-400 font-bold animate-pulse">Carregando portal...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
