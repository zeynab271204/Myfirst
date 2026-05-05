import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { DashboardView } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus, Menu, X } from 'lucide-react';
import { NewTicketModal } from './NewTicketModal';
import { AdminUsers } from './AdminUsers';
import { AdminCompanies } from './AdminCompanies';
import { motion, AnimatePresence } from 'motion/react';

import { HomePage } from './HomePage';
import { AdminSettings } from './AdminSettings';
import { KnowledgeBase } from './KnowledgeBase';

export function Dashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('home');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={(view) => setCurrentView(view)} />;
      case 'tickets':
        return (
          <div className="flex-1 flex overflow-hidden">
            <div className={`${selectedTicketId ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-[#e2e8f0] bg-white`}>
              <TicketList 
                onSelectTicket={setSelectedTicketId} 
                selectedId={selectedTicketId} 
              />
            </div>
            
            {selectedTicketId && (
              <div className="flex-1 flex flex-col bg-[#f8fafc]">
                <TicketDetail 
                  ticketId={selectedTicketId} 
                  onClose={() => setSelectedTicketId(null)} 
                />
              </div>
            )}
          </div>
        );
      case 'users':
        return <AdminUsers />;
      case 'companies':
        return <AdminCompanies />;
      case 'settings':
        return <AdminSettings />;
      case 'kb':
        return <KnowledgeBase />;
      default:
        return <div className="p-12 text-center text-slate-400">Vue en cours de développement...</div>;
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'home': return 'Vue d\'ensemble';
      case 'tickets': return selectedTicketId ? 'Consultation Ticket' : 'Console de Support';
      case 'users': return 'Gestion des Utilisateurs';
      case 'companies': return 'Parc Clients Sage';
      case 'settings': return 'Configuration Système';
      case 'kb': return 'Base de Connaissances';
      default: return 'SageSupport Pro';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[101] md:hidden shadow-2xl"
            >
              <Sidebar 
                currentView={currentView} 
                onViewChange={(view) => {
                  setCurrentView(view);
                  setSelectedTicketId(null);
                }}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setSelectedTicketId(null);
          }} 
        />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[64px] border-b border-[#e2e8f0] bg-white flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-brand-primary active:scale-90 transition-transform"
            >
              <Menu size={24} />
            </button>
            <div className="w-2 h-6 bg-brand-secondary rounded-full hidden xs:block" />
            <h2 className="text-[11px] md:text-sm font-black text-brand-primary uppercase tracking-widest truncate">
              {getHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Utilisateur</p>
              <p className="text-xs font-black text-brand-primary uppercase">{profile?.role}</p>
            </div>
            {currentView === 'tickets' && (
              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="bg-brand-primary text-white p-2 md:px-5 md:py-2 rounded-sm text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/10 active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden xs:inline">Nouveau Ticket</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        {renderView()}
      </main>

      {isNewTicketModalOpen && (
        <NewTicketModal onClose={() => setIsNewTicketModalOpen(false)} />
      )}
    </div>
  );
}
