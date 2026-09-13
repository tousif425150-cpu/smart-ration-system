import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Admin, LoginService, LoginRequest, extractErrorMessage } from '../services/api';

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = 'srs_token';
const ADMIN_KEY = 'srs_admin';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: localStorage.getItem(TOKEN_KEY),
      admin: (() => {
        const saved = localStorage.getItem(ADMIN_KEY);
        return saved ? JSON.parse(saved) : null;
      })(),
      isAuthenticated: !!localStorage.getItem(TOKEN_KEY),

      login: async (payload: LoginRequest) => {
        const response = await LoginService.login(payload);
        const { accessToken, admin } = response.data;
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
        set({ token: accessToken, admin, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
        localStorage.removeItem('srs_user');
        set({ token: null, admin: null, isAuthenticated: false });
      },
    }),
    {
      name: 'srs-auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);

export { extractErrorMessage };
