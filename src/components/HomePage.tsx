import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { 
  Ticket, 
  Users, 
  Building2, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: 'tickets' | 'users' | 'companies') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { profile } = useAuth();
  const isManagement = profile?.role === 'admin' || profile?.role === 'agent';

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc] p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Ravi de vous revoir, <span className="text-blue-600">{profile?.displayName?.split(' ')[0]}</span>.
          </h1>
          <p className="text-slate-500 font-medium">
            Voici ce qui se passe aujourd'hui sur votre portail SageSupport.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Tickets Actifs', value: '12', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Résolus (ce mois)', value: '45', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Temps moyen', value: '4.2h', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-sm flex items-center justify-center`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            onClick={() => onNavigate('tickets')}
            className="group bg-white p-6 border border-[#e2e8f0] rounded-sm hover:border-blue-400 transition-all text-left shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-600 text-white rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Ticket size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Support Technique</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Consultez vos tickets ou posez une question technique sur vos modules Sage.
            </p>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
              Accéder <ArrowRight size={14} />
            </div>
          </button>

          {isManagement && (
            <>
              <button 
                onClick={() => onNavigate('companies')}
                className="group bg-white p-6 border border-[#e2e8f0] rounded-sm hover:border-blue-400 transition-all text-left shadow-sm"
              >
                <div className="w-12 h-12 bg-slate-900 text-white rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Parc Clients</h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Gérez les entreprises, les versions installées et les contrats de maintenance.
                </p>
                <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-widest">
                  Gérer <ArrowRight size={14} />
                </div>
              </button>

              <button 
                onClick={() => onNavigate('users')}
                className="group bg-white p-6 border border-[#e2e8f0] rounded-sm hover:border-blue-400 transition-all text-left shadow-sm"
              >
                <div className="w-12 h-12 bg-slate-100 text-slate-600 border border-slate-200 rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Collaborateurs</h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Attribuez des rôles, gérez les accès clients et les délégations de support.
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest">
                  Configurer <ArrowRight size={14} />
                </div>
              </button>
            </>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 p-8 bg-blue-600 rounded-sm text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <h4 className="text-lg font-black uppercase tracking-tight mb-2">Webinaire Partenaire</h4>
            <p className="text-blue-100 text-sm">
              Découvrez les nouveautés de la v11 de Sage Comptabilité lors de notre session Live mardi prochain.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 text-xs font-black uppercase tracking-widest rounded-sm whitespace-nowrap hover:bg-slate-50 transition-colors shadow-lg">
            S'inscrire gratuitement
          </button>
        </div>
      </motion.div>
    </div>
  );
}
