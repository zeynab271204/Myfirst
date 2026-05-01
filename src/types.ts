export type UserRole = 'client' | 'agent' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DashboardView = 'home' | 'tickets' | 'users' | 'companies' | 'settings';

export interface SystemConfig {
  maintenanceMode: boolean;
  welcomeMessage: string;
  supportPhone: string;
  supportEmail: string;
  lastUpdated: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId?: string;
  createdAt: any;
}

export interface Company {
  id: string;
  name: string;
  sageVersion?: string;
  contactEmail?: string;
  createdAt: any;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  sageModule: string;
  companyId: string;
  clientId: string;
  agentId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export const SAGE_MODULES = [
  'Comptabilité',
  'Paie & RH',
  'Gestion Commerciale',
  'Immobilisations',
  'Moyens de Paiement',
  'Trésorerie',
  'États Comptables et Fiscaux',
  'CRM',
  'Autre'
];
