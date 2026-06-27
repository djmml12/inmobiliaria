import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type RolNombre = 'ADMINISTRADOR' | 'SECRETARIA' | 'COBRANZA' | 'CONTABILIDAD' | 'VENTAS';

export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  email: string | null;
  rol: RolNombre;
  activo: boolean;
  createdAt: string;
}

export interface CreateUsuarioData {
  username: string;
  nombre: string;
  password: string;
  rol: RolNombre;
  email?: string;
}

export interface UpdateUsuarioData {
  nombre?: string;
  rol?: RolNombre;
  password?: string;
  email?: string;
}

export function useUsuarios() {
  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get('/api/usuarios')).data,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: CreateUsuarioData) => api.post('/api/usuarios', datos).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useActualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: UpdateUsuarioData }) =>
      api.patch(`/api/usuarios/${id}`, datos).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useDesactivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/usuarios/${id}/desactivar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useActivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/usuarios/${id}/activar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}
