/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { PublicTicketForm } from './components/PublicTicketForm';
import { LogIn, UserCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

function AppContent() {
  const { user, profile, loading, login } = useAuth();
  const [showPublicForm, setShowPublicForm] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

  // Handle direct links via URL paths or search params
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');

      if (path === '/client' || path === '/support' || portal === 'client') {
        setShowPublicForm(true);
        setIsAgentRoute(false);
      } else if (path === '/agent' || path === '/admin' || path === '/login' || portal === 'agent') {
        setIsAgentRoute(true);
        setShowPublicForm(false);
      } else {
        setShowPublicForm(false);
        setIsAgentRoute(false);
      }
    };

    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    
    // Also listen for a custom event we can trigger when doing pushState
    window.addEventListener('locationchange', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('locationchange', handleNavigation);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Dashboard for logged in users
  if (user && profile) {
    return <Dashboard />;
  }

  // PORTAL CLIENT DÉDIÉ
  if (showPublicForm) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-black text-brand-primary tracking-tighter">ITECH<span className="text-brand-secondary underline decoration-4 underline-offset-4 decoration-brand-secondary/30">CLIENT</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Services d'Assistance Technique</p>
        </motion.div>
        <div className="max-w-4xl w-full">
          <PublicTicketForm onBack={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('locationchange'));
            setShowPublicForm(false);
          }} />
        </div>
      </div>
    );
  }

  // PORTAL AGENT DÉDIÉ
  if (isAgentRoute) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-brand-secondary/10 rounded-full blur-[80px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl relative z-10"
        >
          <div className="text-center space-y-8">
            <div className="inline-flex p-6 rounded-3xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <ShieldCheck size={56} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">ITECH<span className="text-brand-primary">CONSOLE</span></h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest px-4">Système de gestion des interventions prioritaires.</p>
            </div>
            
            <div className="pt-4">
              <button
                onClick={login}
                className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-brand-primary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20 active:scale-95"
              >
                <LogIn size={20} />
                Accès Authentifié
              </button>
            </div>

            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('locationchange'));
                setIsAgentRoute(false);
              }}
              className="text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-slate-400 transition-colors pt-4"
            >
              ← Retour au portail public
            </button>
          </div>
        </motion.div>
        
        <div className="mt-12 text-slate-700 text-[9px] font-bold uppercase tracking-[0.4em] z-10 flex gap-4">
          <span>PROTÉGÉ PAR ITECH AFRIQUE</span>
          <span>•</span>
          <span>2026</span>
        </div>
      </div>
    );
  }

    // PAGE D'ACCUEIL / SÉLECTION (PAR DÉFAUT)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full text-center space-y-12"
        >
          {/* Brand Header */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-brand-primary font-sans flex items-center justify-center gap-2">
              ITECH<span className="text-brand-secondary underline decoration-8 decoration-brand-secondary/20 underline-offset-8">AFRIQUE</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Assistance Technique & Consulting Sage</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-12 w-full max-w-5xl mx-auto px-4 md:px-0">
            {/* Client Portal Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-6 md:p-10 rounded-[2.5rem] border-2 border-slate-50 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center space-y-6"
            >
              <div className="p-5 rounded-2xl bg-emerald-50 text-emerald-600">
                <UserCircle2 size={48} className="md:w-16 md:h-16" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">ESPACE CLIENT</h2>
                <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">Vous avez un problème technique ? Ouvrez un ticket instantanément sans compte ou accédez à vos dossiers.</p>
              </div>
              <div className="w-full space-y-4 pt-6">
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/?portal=client');
                    window.dispatchEvent(new Event('locationchange'));
                  }}
                  className="w-full py-5 bg-brand-secondary text-brand-primary rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-secondary/20"
                >
                  Ouvrir un Ticket Sans Compte
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={login}
                  className="w-full py-4 text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Accès Client Enregistré
                </button>
              </div>
            </motion.div>

            {/* Consultant Portal Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
              
              <div className="p-5 rounded-2xl bg-brand-primary/20 text-brand-primary relative z-10">
                <ShieldCheck size={48} className="md:w-16 md:h-16" />
              </div>
              <div className="space-y-3 relative z-10">
                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">ESPACE CONSULTANT</h2>
                <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">Accès réservé aux techniciens et administrateurs ITECH AFRIQUE pour la gestion des interventions.</p>
              </div>
              <div className="w-full pt-6 relative z-10">
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/?portal=agent');
                    window.dispatchEvent(new Event('locationchange'));
                  }}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-white hover:text-brand-primary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
                >
                  <LogIn size={20} />
                  Accès Consultant
                </button>
              </div>
            </motion.div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-300">
             <span className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-secondary rounded-full" /> Support Technique 24/7</span>
             <span className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-primary rounded-full" /> Intégrateur Sage Agrée</span>
             <span className="flex items-center gap-2"><div className="w-1 h-1 bg-brand-secondary rounded-full" /> Assistance ITECH AFRIQUE</span>
          </div>
        </motion.div>
      </div>
    );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
