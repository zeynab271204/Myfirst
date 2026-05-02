import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { DashboardView } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus } from 'lucide-react';
import { NewTicketModal } from './NewTicketModal';
import { AdminUsers } from './AdminUsers';
import { AdminCompanies } from './AdminCompanies';

import { HomePage } from './HomePage';
import { AdminSettings } from './AdminSettings';
import { KnowledgeBase } from './KnowledgeBase';

export function Dashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('home');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

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
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedTicketId(null);
        }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[64px] border-b border-[#e2e8f0] bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-slate-200 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {getHeaderTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Côté Dashboard</p>
              <p className="text-xs font-bold text-slate-700 uppercase">{profile?.role}</p>
            </div>
            {currentView === 'tickets' && (
              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus size={18} />
                Nouveau Ticket
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
