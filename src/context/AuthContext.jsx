import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Supabase v2: onAuthStateChange handles INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    // This is the single source of truth for auth lifecycle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('--- GLOBAL AUTH EVENT ---', event, session?.user?.id);
      
      if (!mounted) return;

      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (session) {
          // Precisamos buscar o profile ANTES de tirar o loading, pois PrivateRoute depende do role
          setUser(prevUser => {
            if (!prevUser || prevUser.id !== session.user.id) {
               fetchProfile(session.user.id).then((profileData) => {
                 if (profileData) {
                   setUser(profileData);
                 } else {
                   setUser({ id: session.user.id, email: session.user.email, name: 'Usuário', role: 'aluno' });
                 }
                 setLoading(false);
               });
               return prevUser; // Mantém o estado atual (null se for o início) 
            } else {
               setLoading(false);
               return prevUser;
            }
          });
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Core Auth Handler Error:', err);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);





  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.warn('No profile found for user:', userId);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error.message);
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