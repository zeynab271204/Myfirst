import { useEffect, useState, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Ticket, Message, TicketStatus } from '../types';
import { Send, X, User, ShieldCheck, Clock, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { profile } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticketRef = doc(db, 'tickets', ticketId);
    const unsubscribeTicket = onSnapshot(ticketRef, (doc) => {
      if (doc.exists()) {
        setTicket({ id: doc.id, ...doc.data() } as Ticket);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tickets/${ticketId}`);
    });

    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tickets/${ticketId}/messages`);
    });

    return () => {
      unsubscribeTicket();
      unsubscribeMessages();
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || isSending) return;

    setIsSending(true);
    try {
      const messageContent = newMessage;
      await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
        content: messageContent,
        authorId: profile.uid,
        authorName: profile.displayName || 'Utilisateur',
        createdAt: serverTimestamp(),
      });
      
      // Notify agent via background API
      fetch('/api/notify-new-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          messageContent: messageContent,
          authorName: profile.displayName || 'Utilisateur'
        })
      }).catch(err => console.error('Notification error:', err));

      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketId}/messages`);
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (newStatus: TicketStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  };

  if (!ticket) return null;

  const isAgent = profile?.role === 'agent' || profile?.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="bg-white p-8 border-b border-[#e2e8f0] shrink-0">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xs py-1 px-2 border border-slate-200 bg-slate-50 rounded-sm text-slate-500 leading-none">
                #SG-{ticket.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100`}>
                {ticket.sageModule}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-sm text-slate-400 transition-colors border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="prose prose-slate prose-sm max-w-none text-slate-700 bg-white p-6 border border-[#e2e8f0] rounded-sm shadow-sm">
          <ReactMarkdown>{ticket.description}</ReactMarkdown>
        </div>

        {isAgent && (
          <div className="mt-6 flex gap-3">
            <button 
              onClick={() => updateStatus('in_progress')}
              disabled={ticket.status === 'in_progress'}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Prendre en charge
            </button>
            <button 
              onClick={() => updateStatus('closed')}
              disabled={ticket.status === 'closed'}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              Clôturer définitivement
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.authorId === profile?.uid;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                  isMe ? 'bg-blue-600 border-blue-500' : 'bg-white border-[#e2e8f0]'
                }`}>
                  {isMe ? <User size={16} className="text-white" /> : <ShieldCheck size={16} className="text-slate-400" />}
                </div>
                <div className={`max-w-[80%] space-y-1.5 ${isMe ? 'items-end' : ''}`}>
                  <div className={`p-5 rounded-[4px] text-sm leading-relaxed border ${
                    isMe 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' 
                    : 'bg-white text-slate-700 border-[#e2e8f0] shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-3 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {msg.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-none">
                      {msg.createdAt instanceof Timestamp ? msg.createdAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-white border-t border-[#e2e8f0] shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message technique..."
            className="flex-1 h-12 px-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-sm focus:ring-1 focus:ring-blue-600 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-12 px-6 bg-blue-600 text-white rounded-sm text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            <Send size={18} />
            Répondre
          </button>
        </form>
      </div>
    </div>
  );
}
