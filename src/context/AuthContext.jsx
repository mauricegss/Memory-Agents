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

  useEffect(() => {
    let isMounted = true;
    let forceStopTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000); // Força parar de carregar após 4 segundos se algo travar

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) {
            setUser(profile || {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || 'Usuário',
              role: session.user.user_metadata?.role || 'aluno',
            });
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(forceStopTimeout);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (_event === 'INITIAL_SESSION') return;

      try {
        if (!session?.user) {
          setUser(null);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setUser(profile || {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'Usuário',
            role: session.user.user_metadata?.role || 'aluno',
          });
        }
      } catch {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(forceStopTimeout);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut failed, forcing local storage clear:', err);
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
