import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, Company } from '../types';
import { UserCog, Building, ShieldCheck, User } from 'lucide-react';

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() }) as UserProfile));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const companiesQuery = query(collection(db, 'companies'), orderBy('name', 'asc'));
    const unsubscribeCompanies = onSnapshot(companiesQuery, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Company));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'companies'));

    return () => {
      unsubscribeUsers();
      unsubscribeCompanies();
    };
  }, []);

  const updateRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateCompany = async (uid: string, companyId: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { companyId });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updatePhone = async (uid: string, phone: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { phone });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail || !newAgentName) return;
    setIsAdding(true);
    try {
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      // We use email as temporary ID for pre-registration
      const tempId = `pre_${newAgentEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await setDoc(doc(db, 'users', tempId), {
        uid: tempId,
        email: newAgentEmail,
        phone: newAgentPhone,
        role: 'agent',
        displayName: newAgentName,
        createdAt: serverTimestamp(),
        isPreRegistered: true
      });
      setNewAgentEmail('');
      setNewAgentPhone('');
      setNewAgentName('');
      alert("Agent pré-enregistré avec succès ! Il pourra se connecter avec son email.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/pre_agent');
    } finally {
      setIsAdding(false);
    }
  };

  const agentsCount = users.filter(u => u.role === 'agent').length;
  const clientsCount = users.filter(u => u.role === 'client').length;

  if (loading) return <div className="p-8 text-center text-slate-400">Chargement des utilisateurs...</div>;

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tight">Console d'Administration</h2>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                <ShieldCheck size={12} className="text-brand-primary" />
                {agentsCount} Consultants
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                <User size={12} className="text-brand-secondary" />
                {clientsCount} Clients
              </div>
            </div>
          </div>
          
          <form onSubmit={addAgent} className="w-full lg:w-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Enregistrer un nouveau Consultant</h3>
            <div className="flex flex-wrap gap-3">
              <input 
                type="text"
                placeholder="Nom complet"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-none flex-1 min-w-[180px]"
                required
              />
              <input 
                type="email"
                placeholder="Email professionnel"
                value={newAgentEmail}
                onChange={(e) => setNewAgentEmail(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-none flex-1 min-w-[180px]"
                required
              />
              <input 
                type="text"
                placeholder="Téléphone"
                value={newAgentPhone}
                onChange={(e) => setNewAgentPhone(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-primary outline-none w-full sm:w-32"
              />
              <button 
                type="submit"
                disabled={isAdding}
                className="bg-brand-primary text-white px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 whitespace-nowrap active:scale-95 shadow-lg shadow-brand-primary/10"
              >
                {isAdding ? 'Enregistrement...' : 'Valider Inscription'}
              </button>
            </div>
          </form>
        </div>
      </div>

      
      <table className="w-full border-collapse">
        <thead className="bg-[#f1f5f9]">
          <tr>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur</th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Rôle</th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Téléphone</th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Entreprise</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center border border-slate-200">
                    <UserCog size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{u.displayName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <select 
                  value={u.role}
                  onChange={(e) => updateRole(u.uid, e.target.value as UserRole)}
                  className="bg-white border border-slate-200 rounded-sm text-xs px-3 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none font-bold uppercase tracking-tight"
                >
                  <option value="client">Client</option>
                  <option value="agent">Consultant Sage</option>
                  <option value="admin">Administrateur</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={u.phone || ''}
                  onChange={(e) => updatePhone(u.uid, e.target.value)}
                  placeholder="Téléphone Agent"
                  className="bg-white border border-slate-200 rounded-sm text-xs px-3 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none w-40"
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-slate-400" />
                  <select 
                    value={u.companyId || ''}
                    onChange={(e) => updateCompany(u.uid, e.target.value)}
                    className="bg-white border border-slate-200 rounded-sm text-xs px-3 py-1.5 focus:ring-1 focus:ring-blue-600 outline-none font-medium min-w-[200px]"
                  >
                    <option value="">Non assigné</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
