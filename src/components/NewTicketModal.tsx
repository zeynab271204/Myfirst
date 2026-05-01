import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { SAGE_MODULES, TicketPriority } from '../types';
import { X, Send, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface NewTicketModalProps {
  onClose: () => void;
}

export function NewTicketModal({ onClose }: NewTicketModalProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [sageModule, setSageModule] = useState(SAGE_MODULES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isSubmitting) return;

    if (!title.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'tickets'), {
        title,
        description,
        status: 'open',
        priority,
        sageModule,
        companyId: profile.companyId || 'default_company', // Should be properly assigned
        clientId: profile.uid,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
      setError('Une erreur est survenue lors de la création du ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-xl rounded-sm shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8fafc]">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Ouvrir un nouveau ticket</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-sm text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Titre de l'incident</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Erreur synchronisation SQL v11"
              className="w-full px-5 py-3 bg-white border border-[#e2e8f0] rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Logiciel Sage</label>
              <div className="relative">
                <select
                  value={sageModule}
                  onChange={(e) => setSageModule(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-[#e2e8f0] rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  {SAGE_MODULES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ↓
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Niveau d'Urgence</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all border ${
                      priority === p 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' 
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description technique</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément les symptômes, les messages d'erreur et le contexte..."
              rows={6}
              className="w-full px-5 py-4 bg-white border border-[#e2e8f0] rounded-sm text-sm focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none placeholder:text-slate-300"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Support technique Markdown activé</p>
          </div>
        </form>

        <div className="p-8 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-3 bg-blue-600 text-white rounded-sm text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/10 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-[0.98]"
          >
            {isSubmitting ? 'Transmission...' : (
              <>
                <Send size={14} />
                Valider l'ouverture
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
