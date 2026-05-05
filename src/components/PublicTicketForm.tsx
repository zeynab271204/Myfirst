import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SAGE_MODULES, TicketPriority } from '../types';
import { Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicTicketFormProps {
  onBack?: () => void;
}

export function PublicTicketForm({ onBack }: PublicTicketFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [sageModule, setSageModule] = useState(SAGE_MODULES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim() || !title.trim() || !description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires (Société, Nom, Email, Titre, Description).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        title,
        description,
        status: 'open',
        priority,
        sageModule,
        companyId: 'public_request',
        companyName,
        clientId: 'anonymous',
        clientName: contactName,
        contactEmail,
        contactPhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Notify administrator
      fetch('/api/notify-new-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: docRef.id,
          title,
          clientName: `${contactName} (${companyName})`
        })
      }).catch(err => console.error('Notification error:', err));

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting public ticket:', error);
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 text-center space-y-6"
      >
        <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Ticket Ouvert avec Succès !</h2>
          <p className="text-slate-500">Un consultant ITECH AFRIQUE reviendra vers vous par email ou téléphone dans les plus brefs délais.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Retour à l'accueil
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-2xl border border-slate-100"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tight">Ouvrir un Ticket de Support</h2>
          <p className="text-slate-400 text-sm font-medium">Aucun compte requis. Experts Sage à votre écoute.</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">
            Annuler
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nom de votre Société *</label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Entreprise S.A."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Votre Nom Complet *</label>
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email de contact *</label>
            <input
              required
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="jean@entreprise.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Téléphone</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+225 ..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="h-px bg-slate-100 my-4" />

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Objet de la demande *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Problème d'impression bulletin de paie"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logiciel Concerné</label>
            <select
              value={sageModule}
              onChange={(e) => setSageModule(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all appearance-none cursor-pointer"
            >
              {SAGE_MODULES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Niveau d'Urgence</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { value: 'low', label: 'Basse' },
                { value: 'medium', label: 'Normale' },
                { value: 'high', label: 'Haute' },
                { value: 'urgent', label: 'Critique' }
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as TicketPriority)}
                  className={`py-3 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    priority === p.value 
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10' 
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Détails de l'incident *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre problème le plus précisément possible..."
            rows={5}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? 'Transmission...' : (
            <>
              <Send size={20} />
              Envoyer ma demande au support
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
