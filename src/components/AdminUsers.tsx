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
import { UserCog, Building } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-center text-slate-400">Chargement des utilisateurs...</div>;

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Contrôle d'accès et rôles</p>
        </div>
      </div>
      
      <table className="w-full border-collapse">
        <thead className="bg-[#f1f5f9]">
          <tr>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur</th>
            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Rôle</th>
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
