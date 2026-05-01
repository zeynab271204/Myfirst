import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SystemConfig } from '../types';
import { 
  Settings, 
  Bell, 
  ShieldAlert, 
  Smartphone, 
  Mail, 
  Save,
  MessageSquare
} from 'lucide-react';

export function AdminSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // We use a singleton document for system settings
    const configRef = doc(db, 'system', 'config');
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SystemConfig);
      } else {
        // Initialize if not exists
        const defaultConfig: SystemConfig = {
          maintenanceMode: false,
          welcomeMessage: "Bienvenue sur votre espace de support Sage agréé.",
          supportPhone: "01 23 45 67 89",
          supportEmail: "support@sage-expert.fr",
          lastUpdated: serverTimestamp()
        };
        setDoc(configRef, defaultConfig).catch(err => console.error("Init config error:", err));
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'system/config'));

    return () => unsubscribe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    try {
      const configRef = doc(db, 'system', 'config');
      await updateDoc(configRef, {
        ...config,
        lastUpdated: serverTimestamp()
      });
      alert("Configuration mise à jour avec succès !");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system/config');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Chargement des paramètres...</div>;

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-sm flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Paramètres Système</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configuration globale du portail</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Config */}
          <div className="space-y-6">
            <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Bell size={18} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Interface & Accueil</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message de bienvenue</label>
                  <textarea 
                    value={config?.welcomeMessage || ''}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, welcomeMessage: e.target.value } : null)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert size={18} className="text-red-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Maintenance</h3>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-sm">
                <div>
                  <p className="text-xs font-bold text-red-900 uppercase">Mode Maintenance</p>
                  <p className="text-[10px] text-red-700">Désactive l'accès aux clients</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setConfig(prev => prev ? { ...prev, maintenanceMode: !prev.maintenanceMode } : null)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${config?.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config?.maintenanceMode ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Smartphone size={18} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Support & Contact</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Support</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      value={config?.supportEmail || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, supportEmail: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Téléphone Hotline</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      value={config?.supportPhone || ''}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, supportPhone: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm border-l-4 border-l-amber-400">
              <div className="flex gap-4">
                <MessageSquare className="text-amber-500 shrink-0" size={20} />
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Les modifications apportées ici sont appliquées en temps réel à l'ensemble du portail. 
                  Veillez à ne pas activer le mode maintenance sans informer vos clients au préalable.
                </p>
              </div>
            </div>

            <button 
              disabled={isSaving}
              className="w-full bg-blue-600 text-white py-4 rounded-sm text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Enregistrement...' : 'Mettre à jour la configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
