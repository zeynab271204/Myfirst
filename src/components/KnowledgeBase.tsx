import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { KBArticle, SAGE_MODULES } from '../types';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ChevronRight, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  Filter,
  ArrowLeft
} from 'lucide-react';

export function KnowledgeBase() {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<KBArticle> | null>(null);
  const [viewingArticle, setViewingArticle] = useState<KBArticle | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'agent';

  useEffect(() => {
    let q = query(collection(db, 'kb'), orderBy('updatedAt', 'desc'));
    
    if (!isAdmin) {
      q = query(collection(db, 'kb'), where('isPublished', '==', true), orderBy('updatedAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KBArticle)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'kb'));

    return () => unsubscribe();
  }, [isAdmin]);

  const saveArticle = async () => {
    if (!currentArticle?.title || !currentArticle?.content) return;

    try {
      if (currentArticle.id) {
        await updateDoc(doc(db, 'kb', currentArticle.id), {
          ...currentArticle,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'kb'), {
          ...currentArticle,
          authorId: profile?.uid,
          isPublished: false,
          updatedAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setCurrentArticle(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'kb');
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await deleteDoc(doc(db, 'kb', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'kb');
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (viewingArticle) {
    return (
      <div className="flex-1 bg-white overflow-auto p-12">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setViewingArticle(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                {viewingArticle.category}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{viewingArticle.title}</h1>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg">
                {viewingArticle.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc]">
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Base de Connaissances</h1>
            <p className="text-slate-500 font-medium mt-1">Trouvez des solutions rapides à vos problèmes Sage.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setCurrentArticle({ category: 'Général', isPublished: false });
                setIsEditing(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              <Plus size={16} /> Nouvel Article
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar / Filters */}
          <div className="space-y-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-sm text-xs outline-none focus:ring-1 focus:ring-blue-600 shadow-sm"
              />
            </div>
            
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Catégories</span>
              </div>
              <div className="p-2 space-y-0.5">
                {['Tous', ...SAGE_MODULES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs font-bold transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="md:col-span-3 space-y-4">
            {filteredArticles.map(article => (
              <motion.div 
                layout
                key={article.id}
                className="bg-white border border-slate-200 rounded-sm p-6 group hover:border-blue-400 transition-all shadow-sm flex items-center justify-between"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setViewingArticle(article)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                      {article.category}
                    </span>
                    {!article.isPublished && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                        Brouillon
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2 max-w-xl">
                    {article.content}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => {
                          setCurrentArticle(article);
                          setIsEditing(true);
                        }}
                        title="Modifier l'article"
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-all"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                         onClick={() => deleteArticle(article.id)}
                         title="Supprimer l'article"
                         className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="bg-white p-12 border border-dashed border-slate-200 rounded-sm text-center">
                <BookOpen size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm font-medium">Aucun guide trouvé pour cette recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {currentArticle?.id ? "Modifier l'article" : "Nouvel Article KB"}
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentArticle(prev => ({ ...prev, isPublished: !prev?.isPublished }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                    currentArticle?.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentArticle?.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                  {currentArticle?.isPublished ? 'Publié' : 'Brouillon'}
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titre de l'article</label>
                <input 
                  value={currentArticle?.title || ''}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Comment réinitialiser SQL Server pour Sage"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie Sage</label>
                <select 
                  value={currentArticle?.category || 'Général'}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Général">Général</option>
                  {SAGE_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenu technique</label>
                <textarea 
                  rows={10}
                  value={currentArticle?.content || ''}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Écrivez le guide ici..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setCurrentArticle(null);
                }}
                className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-colors rounded-sm"
              >
                Annuler
              </button>
              <button 
                onClick={saveArticle}
                className="bg-blue-600 text-white px-8 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
              >
                Sauvegarder l'article
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
