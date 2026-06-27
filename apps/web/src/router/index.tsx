import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Login } from '../pages/auth/Login';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { useAuthStore } from '../store/auth.store';
import type { RolNombre } from '@inmobiliaria/shared';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ roles }: { roles: RolNombre[] }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (!usuario || !roles.includes(usuario.rol as RolNombre)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function HomeRedirect() {
  const usuario = useAuthStore((s) => s.usuario);
  if (usuario?.rol === 'RECEPCIONISTA') return <Navigate to="/ventas/nueva" replace />;
  return <Dashboard />;
}

const ADMIN_SUPERVISOR: RolNombre[] = ['ADMINISTRADOR' as RolNombre, 'SUPERVISOR' as RolNombre];
const ADMIN_ONLY: RolNombre[] = ['ADMINISTRADOR' as RolNombre];

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },

      // Accesible para todos los roles autenticados
      {
        path: 'clientes',
        lazy: () =>
          import('../pages/clientes/ClientesList').then((m) => ({ Component: m.ClientesList })),
      },
      {
        path: 'ventas/nueva',
        lazy: () =>
          import('../pages/ventas/NuevaVenta').then((m) => ({ Component: m.NuevaVenta })),
      },
      {
        path: 'reservas',
        lazy: () =>
          import('../pages/reservas/ReservasList').then((m) => ({ Component: m.ReservasList })),
      },
      {
        path: 'pagos/:clienteId',
        lazy: () =>
          import('../pages/pagos/HistorialCliente').then((m) => ({ Component: m.HistorialCliente })),
      },
      {
        path: 'cobros',
        lazy: () =>
          import('../pages/cobros/PanelCobros').then((m) => ({ Component: m.PanelCobros })),
      },
      {
        path: 'cobros-mes',
        lazy: () =>
          import('../pages/cobros/CobrosMes').then((m) => ({ Component: m.CobrosMes })),
      },

      // Solo ADMINISTRADOR y SUPERVISOR
      {
        element: <RequireRole roles={ADMIN_SUPERVISOR} />,
        children: [
          {
            path: 'proyectos',
            lazy: () =>
              import('../pages/proyectos/ProyectosList').then((m) => ({ Component: m.ProyectosList })),
          },
          {
            path: 'proyectos/nuevo',
            lazy: () =>
              import('../pages/proyectos/NuevoProyecto').then((m) => ({ Component: m.NuevoProyecto })),
          },
          {
            path: 'proyectos/:id/plano',
            lazy: () =>
              import('../pages/proyectos/PlanoProyecto').then((m) => ({ Component: m.PlanoProyecto })),
          },
          {
            path: 'proyectos/editar',
            lazy: () =>
              import('../pages/proyectos/NuevoProyecto').then((m) => ({ Component: m.NuevoProyecto })),
          },
          {
            path: 'ventas',
            lazy: () =>
              import('../pages/ventas/VentasList').then((m) => ({ Component: m.VentasList })),
          },
          {
            path: 'pagos',
            lazy: () =>
              import('../pages/pagos/PagosList').then((m) => ({ Component: m.PagosList })),
          },
          {
            path: 'cobros',
            lazy: () =>
              import('../pages/cobros/PanelCobros').then((m) => ({ Component: m.PanelCobros })),
          },
          {
            path: 'lotes-disponibles',
            lazy: () =>
              import('../pages/lotes/LotesDisponibles').then((m) => ({ Component: m.LotesDisponibles })),
          },
          {
            path: 'vendedores',
            lazy: () =>
              import('../pages/vendedores/VendedoresPanel').then((m) => ({ Component: m.VendedoresPanel })),
          },
        ],
      },

      // Solo ADMINISTRADOR
      {
        element: <RequireRole roles={ADMIN_ONLY} />,
        children: [
          {
            path: 'configuracion',
            lazy: () =>
              import('../pages/configuracion/ConfiguracionPanel').then((m) => ({ Component: m.ConfiguracionPanel })),
          },
          {
            path: 'comisiones',
            lazy: () =>
              import('../pages/vendedores/ComisionesPanel').then((m) => ({ Component: m.ComisionesPanel })),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
