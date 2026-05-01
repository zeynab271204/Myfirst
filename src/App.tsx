/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { LogIn, ServerCrash } from 'lucide-react';
import { motion } from 'motion/react';

function AppContent() {
  const { user, profile, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <ServerCrash size={40} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-sans">SageSupport Pro</h1>
            <p className="text-slate-500 text-lg">Connectez-vous pour accéder à votre espace de support technique Sage.</p>
          </div>
          
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg"
          >
            <LogIn size={20} />
            Accès Client / Consultant
          </button>
          
          <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>Support Ticket 24/7</div>
            <div>Expertise Sage Certifiée</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
