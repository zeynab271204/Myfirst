import { useEffect, useState } from 'react';
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
import { Plus, Building2, ExternalLink } from 'lucide-react';

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('i7 v11');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Company));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'companies'));

    return () => unsubscribe();
  }, []);

  const addCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await addDoc(collection(db, 'companies'), {
        name: newName,
        sageVersion: newVersion,
        createdAt: serverTimestamp(),
      });
      setNewName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'companies');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Chargement...</div>;

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc]">
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 border border-[#e2e8f0] rounded-sm">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Ajouter une entreprise</h2>
            <form onSubmit={addCompany} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom de la société</label>
                <input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Cogip SAS"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version Sage</label>
                <input 
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="Ex: Sage 100 Cloud v8"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2.5 rounded-sm text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                <Plus size={14} />
                Enregistrer
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Parc Clients ({companies.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map(company => (
              <div key={company.id} className="bg-white p-5 border border-[#e2e8f0] rounded-sm group hover:border-blue-300 transition-colors relative">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-slate-50 rounded-sm flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <Building2 className="text-slate-400 group-hover:text-blue-500" size={20} />
                  </div>
                  <button className="text-slate-300 hover:text-blue-600">
                    <ExternalLink size={16} />
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{company.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-100">
                      {company.sageVersion}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Contrat Actif</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
