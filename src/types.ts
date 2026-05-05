export type UserRole = 'client' | 'agent' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  isPublished: boolean;
  updatedAt: any;
}

export type DashboardView = 'home' | 'tickets' | 'users' | 'companies' | 'settings' | 'kb';

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
  phone?: string;
  isPreRegistered?: boolean;
  createdAt: any;
}

export interface Company {
  id: string;
  name: string;
  sageVersion?: string;
  sageEdition?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractType?: 'SaaS' | 'On-Premise' | 'Hosted' | 'DSU';
  renewalDate?: any;
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
  companyName?: string;
  clientId: string;
  clientName?: string;
  contactEmail?: string;
  contactPhone?: string;
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
