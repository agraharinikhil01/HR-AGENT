import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../lib/api/client.js';
import { refreshClient } from '../lib/api/refreshClient.js';
import { tokenStore } from './tokenStore.js';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'FINANCE_APPROVER' | 'CANDIDATE';
  orgId: string;
  department?: string;
}

export interface OrgProfile {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  industry: string;
  currency: string;
  departments: Array<{ _id: string; name: string }>;
}

interface AuthContextType {
  user: UserProfile | null;
  organization: OrgProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile, org: OrgProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await client.get('/auth/me');
      setUser(res.data.data.user);
      setOrganization(res.data.data.organization);
    } catch {
      setUser(null);
      setOrganization(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 1. Attempt token refresh using HttpOnly cookie
        const { data } = await refreshClient.post('/auth/refresh');
        if (data?.data?.accessToken) {
          tokenStore.set(data.data.accessToken);
          // 2. Fetch authenticated profile
          await fetchCurrentUser();
        }
      } catch {
        // No valid session cookie found; stay logged out
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = (token: string, u: UserProfile, o: OrgProfile) => {
    tokenStore.set(token);
    setUser(u);
    setOrganization(o);
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      tokenStore.clear();
      setUser(null);
      setOrganization(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-slate-500">Initializing HireFlow AI...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
