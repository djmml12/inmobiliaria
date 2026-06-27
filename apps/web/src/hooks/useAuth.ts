import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        usuario: { id: string; username: string; nombre: string; rol: string };
      }>('/api/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.usuario as Parameters<typeof setAuth>[0], data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
    },
  });
}

export function useRecuperarPassword() {
  return useMutation({
    mutationFn: async (username: string) => {
      const { data } = await api.post<{ mensaje: string }>('/api/auth/recuperar-password', { username });
      return data;
    },
  });
}

export function useLogout() {
  const { logout, accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && accessToken) {
        await api.post('/api/auth/logout', { refreshToken }).catch(() => {});
      }
    },
    onSettled: () => {
      logout();
      localStorage.removeItem('refresh_token');
    },
  });
}
