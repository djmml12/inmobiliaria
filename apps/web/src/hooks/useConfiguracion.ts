import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Configuracion {
  'impuesto.iva.tasa': string;
  'impuesto.timbres.tasa': string;
  'comision.credito.pct': string;
  'comision.credito.fijo': string;
  'comision.debito.pct': string;
  'comision.debito.fijo': string;
  'pagos.dias_aviso': string;
  'pagos.dias_gracia': string;
  'smtp.host': string;
  'smtp.port': string;
  'smtp.secure': string;
  'smtp.user': string;
  'smtp.pass': string;
  'smtp.from': string;
}

export interface ConfigEntry {
  clave: string;
  valor: string;
}

export function useConfiguracion() {
  return useQuery<Configuracion>({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const { data } = await api.get<Configuracion>('/api/configuracion');
      return data;
    },
  });
}

export function useActualizarConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: ConfigEntry[]) => {
      const { data } = await api.patch<Configuracion>('/api/configuracion', { entries });
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['configuracion'], data);
    },
  });
}
