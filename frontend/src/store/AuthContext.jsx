import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, tokenStorage } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Verify session on mount by fetching profile */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await userAPI.getProfile();
        const { token, ...profile } = data;
        if (token) tokenStorage.set(token);
        setUser(profile);
      } catch (err) {
        // No valid session, stay logged out
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      if (data.token) tokenStorage.set(data.token); // Save token for cross-domain auth
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await authAPI.register({ username, email, password });
      if (data.token) tokenStorage.set(data.token); // Save token for cross-domain auth
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      tokenStorage.remove(); // Clear token from localStorage
      setUser(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await userAPI.updateProfile(updates);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Profile update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
