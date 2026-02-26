'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

const TOKEN_KEY = 'quickcourt_token';
const USER_KEY = 'quickcourt_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (token && storedUser) {
          // Verify token is still valid
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
          } else {
            // Token invalid, clear storage
            Cookies.remove(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        Cookies.remove(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password, rememberMe = false) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { user: userData, accessToken } = data.data;
      
      // Store token in cookies
      Cookies.set(TOKEN_KEY, accessToken, {
        expires: rememberMe ? 7 : 1, // 7 days if remember me, else 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Store user in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.join(', ') || 'Registration failed');
      }

      return { 
        success: true, 
        user: data.data.user,
        otpExpiry: data.data.otpExpiry,
        otpCode: data.data.otpCode // Only in development
      };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify OTP function
  const verifyOtp = useCallback(async (email, code, type = 'EMAIL_VERIFICATION') => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code, type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      return { success: true, user: data.data.user };
    } catch (err) {
      const errorMessage = err.message || 'OTP verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Resend OTP function
  const resendOtp = useCallback(async (email, type = 'EMAIL_VERIFICATION') => {
    setError(null);
    
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      return { 
        success: true, 
        otpExpiry: data.data.otpExpiry,
        otpCode: data.data.otpCode // Only in development
      };
    } catch (err) {
      const errorMessage = err.message || 'Failed to resend OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setError(null);
  }, []);

  // Get token function
  const getToken = useCallback(() => {
    return Cookies.get(TOKEN_KEY);
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    getToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
