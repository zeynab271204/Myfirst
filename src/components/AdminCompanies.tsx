import { useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Company } from '../types';
import { 
  Plus, 
  Building2, 
  ExternalLink, 
  Search, 
  Calendar, 
  Filter,
  ShieldCheck,
  Server,
  Zap,
  Info
} from 'lucide-react';

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Form states
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('Sage 100 v11');
  const [newEdition, setNewEdition] = useState('SQL Express');
  const [newContract, setNewContract] = useState<Company['contractType']>('SaaS');

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Company));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'companies'));

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      total: companies.length,
      v11: companies.filter(c => c.sageVersion?.toLowerCase().includes('v11')).length,
      saas: companies.filter(c => c.contractType === 'SaaS').length,
    };
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.sageVersion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || c.contractType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [companies, searchTerm, filterType]);

  const addCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await addDoc(collection(db, 'companies'), {
        name: newName,
        sageVersion: newVersion,
        sageEdition: newEdition,
        contractType: newContract,
        createdAt: serverTimestamp(),
      });
      setNewName('');
      setNewVersion('Sage 100 v11');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'companies');
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Initialisation du Parc...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc]">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Clients" value={stats.total} icon={<Building2 />} color="blue" />
          <StatCard label="Migration v11" value={stats.v11} icon={<Zap />} color="amber" />
          <StatCard label="Clients SaaS" value={stats.saas} icon={<ShieldCheck />} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Creation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <Plus size={18} className="text-blue-600" />
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nouveau Dossier Client</h2>
              </div>
              <form onSubmit={addCompany} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raison Sociale</label>
                  <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: ABC Solutions"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version Sage active</label>
                  <input 
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Édition Base</label>
                  <select 
                    value={newEdition}
                    onChange={(e) => setNewEdition(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    <option value="SQL Express">SQL Express</option>
                    <option value="SQL Server Standard">SQL Server Standard</option>
                    <option value="Propriétaire">Propriétaire</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type de Contrat</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['SaaS', 'On-Premise', 'Hosted', 'DSU'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewContract(t as any)}
                        className={`px-3 py-2 text-[10px] font-black rounded-sm border transition-all ${
                          newContract === t 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                  <Plus size={14} />
                  Enregistrer le Client
                </button>
              </form>
            </div>
          </div>

          {/* List & Filtering */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-4 border border-[#e2e8f0] rounded-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  placeholder="Rechercher un client, une version..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-sm text-sm outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={16} className="text-slate-400" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-sm px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                >
                  <option value="all">Tous les contrats</option>
                  <option value="SaaS">SaaS Only</option>
                  <option value="On-Premise">On-Premise</option>
                  <option value="Hosted">Hosted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanies.map(company => (
                <div key={company.id} className="bg-white border border-[#e2e8f0] rounded-sm group hover:border-blue-400 transition-all shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-sm flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <Building2 className="text-slate-400 group-hover:text-blue-600" size={24} />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          company.contractType === 'SaaS' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {company.contractType || 'Standard'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <Server size={10} />
                          {company.sageEdition || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </h3>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 rounded-sm border border-blue-100">
                        <Zap size={12} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                          {company.sageVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase">Actif</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Info size={14} className="text-slate-300" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Consulter le dossier</span>
                    </div>
                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="bg-white p-12 border border-dashed border-slate-200 rounded-sm text-center">
                <p className="text-slate-400 text-sm font-medium">Aucun client ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'blue' | 'amber' | 'emerald' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm flex items-center gap-6">
      <div className={`w-14 h-14 rounded-sm flex items-center justify-center border-2 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

