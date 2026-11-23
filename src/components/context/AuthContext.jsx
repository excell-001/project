import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { AuthContext } from './authContextStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const userProfile = await authService.getUserProfile(currentUser.id);
      setProfile(userProfile);
    } catch (err) {
      console.error('Gagal memuat profil pengguna:', err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        loadProfile(currentUser);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        loadProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (credentials) => {
    const data = await authService.signIn(credentials);
    if (data?.user) {
      const userProfile = await authService.getUserProfile(data.user.id);
      setProfile(userProfile);
      return userProfile;
    }
    return null;
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const value = {
    user,
    profile,
    role: profile?.role || null,
    isAuthenticated: !!user && !!profile,
    isSupervisor: profile?.role === 'supervisor',
    isTeacher: profile?.role === 'teacher',
    loading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}