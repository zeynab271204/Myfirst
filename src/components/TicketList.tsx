import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Filter,
  Ticket as TicketIcon
} from 'lucide-react';

interface TicketListProps {
  onSelectTicket: (id: string) => void;
  selectedId: string | null;
}

export function TicketList({ onSelectTicket, selectedId }: TicketListProps) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;

    let ticketsQuery;
    const ticketsRef = collection(db, 'tickets');

    if (profile.role === 'client') {
      ticketsQuery = query(
        ticketsRef,
        where('clientId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Agents/Admins see all for now
      ticketsQuery = query(
        ticketsRef,
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    });

    return () => unsubscribe();
  }, [profile]);

  const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Ouvert',
    in_progress: 'En cours',
    closed: 'Clôturé'
  };

  const PRIORITY_LABELS: Record<TicketPriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Critique'
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-brand-primary/5 text-brand-primary border border-brand-primary/10';
      case 'in_progress': return 'bg-orange-50 text-orange-800 border border-orange-200';
      case 'closed': return 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'low': return 'text-slate-500';
      case 'medium': return 'text-blue-500';
      case 'high': return 'text-orange-500';
      case 'urgent': return 'text-red-500';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.sageModule.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 bg-[#f1f5f9]/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Référence, client ou logiciel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-sm text-sm focus:ring-1 focus:ring-brand-primary transition-all outline-none"
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#f1f5f9] z-10">
            <tr>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e8f0]">Référence</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e8f0]">Sage</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e8f0]">Urgence</th>
              <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#e2e8f0]">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">Chargement...</td></tr>
            ) : filteredTickets.map((ticket) => (
              <tr 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={`group cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === ticket.id ? 'bg-brand-primary/5' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-xs text-brand-primary">#SG-{ticket.id.slice(0, 6).toUpperCase()}</span>
                    <span className="text-sm font-bold text-slate-800 line-clamp-1 mt-1 group-hover:text-brand-primary">{ticket.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-600">{ticket.sageModule}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                    <span>●</span>
                    <span className="capitalize">{PRIORITY_LABELS[ticket.priority]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase ${getStatusBadge(ticket.status)}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
