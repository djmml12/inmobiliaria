import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RolNombre } from '@inmobiliaria/shared';

interface Usuario {
  id: string;
  username: string;
  nombre: string;
  rol: RolNombre;
}

interface AuthStore {
  usuario: Usuario | null;
  accessToken: string | null;
  setAuth: (usuario: Usuario, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      setAuth: (usuario, accessToken) => set({ usuario, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ usuario: null, accessToken: null }),
    }),
    { name: 'auth' },
  ),
);
