import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  Users, 
  Settings, 
  LogOut,
  Building2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardView } from '../types';

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onClose?: () => void;
}

export function Sidebar({ currentView, onViewChange, onClose }: SidebarProps) {
  const { profile, logout } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', id: 'home' as DashboardView },
    { icon: HelpCircle, label: 'Espace Aide', id: 'kb' as DashboardView },
    { icon: TicketIcon, label: 'Tickets Support', id: 'tickets' as DashboardView },
    { icon: Building2, label: 'Parc Clients', id: 'companies' as DashboardView, restricted: true },
    { icon: Users, label: 'Gestion Equipe', id: 'users' as DashboardView, restricted: true },
    { icon: Settings, label: 'Paramètres', id: 'settings' as DashboardView, restricted: true },
  ];

  const isManagement = profile?.role === 'admin' || profile?.role === 'agent';
  const isAdminOnly = profile?.role === 'admin';

  return (
    <div className="w-[240px] bg-white border-r border-[#e2e8f0] text-slate-600 flex flex-col h-full shrink-0 font-sans">
      <div className="p-6 mb-4">
        <h1 className="text-xl font-black text-brand-primary tracking-tight">
          ITECH<span className="text-brand-secondary">AFRIQUE</span>
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          Centre de Compétence SAGE
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item, index) => {
          if (item.restricted && !isManagement) return null;
          if (item.id === 'settings' && !isAdminOnly) return null;
          
          const isActive = currentView === item.id;
          
          return (
            <button
              key={index}
              onClick={() => {
                onViewChange(item.id);
                if (window.innerWidth < 768 && onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                isActive 
                ? 'bg-brand-primary/5 text-brand-primary' 
                : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-1 h-4 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-transparent'}`} />
              <item.icon size={18} className={isActive ? 'text-brand-primary' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-md mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              {profile?.displayName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">ID: {profile?.uid.slice(0, 8)}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
