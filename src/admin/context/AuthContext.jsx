import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isEditor: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const withTimeout = (promise, timeoutMs = 8000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Authentication request timed out.')), timeoutMs)),
  ]);

  // Helper to fetch user profile
  const fetchProfile = async (userId) => {
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AuthProvider] Failed to fetch profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[AuthProvider] Network error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Get current session, but never block the whole admin shell forever if
    // Supabase is unavailable, blocked, or misconfigured on the deployment.
    withTimeout(supabase.auth.getSession())
      .then(async ({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        // Keep route guards waiting until the role profile is resolved.
        setLoading(false);
      })
      .catch((error) => {
        console.warn('[AuthProvider] Session bootstrap failed:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setLoading(true);
          fetchProfile(currentUser.id)
            .then((userProfile) => setProfile(userProfile))
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data?.user) {
      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);
    }
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'editor' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated,
        isAdmin,
        isEditor,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
