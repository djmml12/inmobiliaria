import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  PlusCircle,
  CreditCard,
  LineChart,
  Settings,
  LogOut,
  UserCheck,
  Medal,
  BookMarked,
} from 'lucide-react';
import { useLogout } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';

function NavItem({ to, icon: Icon, label }: { to: string; icon: typeof MapPin; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { mutate: logout } = useLogout();
  const usuario = useAuthStore((s) => s.usuario);
  const rol = usuario?.rol;

  const esAdmin = rol === 'ADMINISTRADOR';
  const esSupervisor = rol === 'SUPERVISOR';

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
          SI
        </div>
        <span className="text-sm font-semibold text-gray-800 leading-tight">
          Sistema<br />Inmobiliario
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {/* Dashboard — solo Admin y Supervisor */}
        {(esAdmin || esSupervisor) && (
          <NavItem to="/" icon={LayoutDashboard} label="Panel" />
        )}

        {/* Proyectos — solo Admin y Supervisor */}
        {(esAdmin || esSupervisor) && (
          <NavItem to="/proyectos" icon={MapPin} label="Proyectos" />
        )}

        {/* Clientes — todos los roles */}
        <NavItem to="/clientes" icon={Users} label="Clientes" />

        {/* Nueva venta — todos los roles */}
        <NavItem to="/ventas/nueva" icon={PlusCircle} label="Nueva venta" />

        {/* Reservas de lotes — todos los roles */}
        <NavItem to="/reservas" icon={BookMarked} label="Reservas" />

        {/* Pagos (lista/resumen) — solo Admin y Supervisor */}
        {(esAdmin || esSupervisor) && (
          <NavItem to="/pagos" icon={CreditCard} label="Pagos" />
        )}

        {/* Información financiera (panel de cobros) — solo Admin y Supervisor */}
        {(esAdmin || esSupervisor) && (
          <NavItem to="/cobros" icon={LineChart} label="Información financiera" />
        )}


        {/* Sección Admin y Supervisor */}
        {(esAdmin || esSupervisor) && (
          <>
            <NavItem to="/vendedores" icon={UserCheck} label="Asesores de ventas" />
          </>
        )}

        {/* Sección solo Administrador */}
        {esAdmin && (
          <NavItem to="/comisiones" icon={Medal} label="Comisiones" />
        )}
      </nav>

      <div className="border-t border-gray-100 p-3">
        {esAdmin && (
          <NavItem to="/configuracion" icon={Settings} label="Configuración" />
        )}
        <div className="mb-2 px-3 py-1">
          <p className="text-xs font-medium text-gray-900 truncate">{usuario?.nombre}</p>
          <p className="text-xs text-gray-500 truncate capitalize">
            {esAdmin ? 'Administrador' : esSupervisor ? 'Supervisor' : 'Recepcionista'}
          </p>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
