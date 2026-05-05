import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemConfig, Company, DashboardView } from '../types';
import { 
  Ticket, 
  Users, 
  Building2, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: DashboardView) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { profile } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  
  const isManagement = profile?.role === 'admin' || profile?.role === 'agent';
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Fetch Global Config
    const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as SystemConfig);
    });

    // Fetch User Company if client
    if (profile?.companyId) {
      getDoc(doc(db, 'companies', profile.companyId)).then(snap => {
        if (snap.exists()) setUserCompany({ id: snap.id, ...snap.data() } as Company);
      });
    }

    return () => unsubscribe();
  }, [profile?.companyId]);

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc] p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-sm border border-brand-primary/10">
              {profile?.role === 'admin' ? 'Administration' : profile?.role === 'agent' ? 'Consultant Sage' : 'Espace Client'}
            </div>
            {userCompany && (
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-sm border border-slate-200">
                {userCompany.name} • {userCompany.sageVersion}
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            {isManagement ? "Tableau de Bord Consultant" : "Comment pouvons-nous vous aider ?"}
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl">
            {config?.welcomeMessage || "Bienvenue sur votre portail de support Sage agréé."}
          </p>
        </div>

        {isManagement ? (
          /* ADMIN / AGENT VIEW */
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Attentes prioritaires', value: '8', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Entreprises gérées', value: '24', icon: Building2, color: 'text-brand-primary', bg: 'bg-brand-primary/5' },
                { label: 'Satisfaction Client', value: '98%', icon: ShieldCheck, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-sm flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-none mb-2">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard 
                title="Base de Tickets"
                description="Gérer le flux des demandes entrantes et les interventions techniques."
                icon={<Ticket size={24} />}
                onClick={() => onNavigate('tickets')}
                theme="blue"
              />
              <QuickActionCard 
                title="Aide & FAQ"
                description="Rédiger et publier des guides de dépannage pour vos clients."
                icon={<BookOpen size={24} />}
                onClick={() => onNavigate('kb')}
                theme="emerald"
              />
              <QuickActionCard 
                title="Parc Clients"
                description="Suivi des versions Sage, des contrats et des configurations."
                icon={<Building2 size={24} />}
                onClick={() => onNavigate('companies')}
                theme="dark"
              />
              {isAdmin && (
                <QuickActionCard 
                  title="Configuration"
                  description="Paramètres de maintenance et coordonnées du support."
                  icon={<Zap size={24} />}
                  onClick={() => onNavigate('settings')}
                  theme="amber"
                />
              )}
            </div>
          </div>
        ) : (
          /* CLIENT VIEW */
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <button 
                  onClick={() => onNavigate('tickets')}
                  className="w-full group bg-brand-primary p-12 rounded-sm text-left shadow-2xl shadow-brand-primary/20 hover:bg-slate-800 transition-all flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Ouvrir un ticket</h3>
                    <p className="text-white/60 font-medium italic">Une expertise Sage à votre service immédiat.</p>
                  </div>
                  <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform shadow-lg shadow-brand-secondary/30">
                    <Zap size={32} />
                  </div>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 border border-[#e2e8f0] rounded-sm">
                    <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center mb-6">
                      <Clock size={20} className="text-slate-600" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Mes Interventions</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Suivez l'état d'avancement de vos demandes en cours.</p>
                    <button onClick={() => onNavigate('tickets')} className="text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      Voir mes tickets <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="bg-white p-8 border border-[#e2e8f0] rounded-sm">
                    <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center mb-6">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Base de Connaissances</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Consultez nos guides techniques et FAQ avant d'ouvrir un ticket.</p>
                    <button onClick={() => onNavigate('kb')} className="text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      Explorer la FAQ <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Support */}
              <div className="space-y-6">
                <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Hotline d'urgence</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-primary/5 text-brand-primary rounded-sm flex items-center justify-center">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Téléphone</p>
                        <p className="text-sm font-black text-slate-800">{config?.supportPhone || "01 23 45 67 89"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-primary/5 text-brand-primary rounded-sm flex items-center justify-center">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Email</p>
                        <p className="text-sm font-black text-slate-800">{config?.supportEmail || "support@sagesupport.pro"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mt-1" />
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        Nos consultants sont actuellement en ligne. Temps d'attente estimé : <span className="font-bold text-slate-800">Moins de 5 min</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  theme: 'blue' | 'dark' | 'amber' | 'emerald';
}

function QuickActionCard({ title, description, icon, onClick, theme }: QuickActionCardProps) {
  const themes = {
    blue: "bg-brand-primary text-white",
    dark: "bg-slate-900 text-white",
    amber: "bg-amber-500 text-white",
    emerald: "bg-brand-secondary text-brand-primary font-bold"
  };

  const btnText = {
    blue: "text-brand-primary",
    dark: "text-slate-900",
    amber: "text-amber-600",
    emerald: "text-brand-primary"
  };

  return (
    <button 
      onClick={onClick}
      className="group bg-white p-8 border border-[#e2e8f0] rounded-sm hover:border-brand-primary/30 transition-all text-left shadow-sm hover:shadow-md"
    >
      <div className={`w-12 h-12 ${themes[theme]} rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
        {description}
      </p>
      <div className={`flex items-center gap-2 ${btnText[theme]} text-[10px] font-black uppercase tracking-widest`}>
        Ouvrir le module <ArrowRight size={14} />
      </div>
    </button>
  );
}

