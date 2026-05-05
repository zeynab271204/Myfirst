import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Check if user was pre-registered by email
          let preRegData: any = null;
          let preRegId: string | null = null;

          try {
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const snap = querySnapshot.docs[0];
              preRegData = snap.data();
              preRegId = snap.id;
            }
          } catch (e) {
            console.error("Error checking pre-registration:", e);
          }

          // Initialize profile for new users
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || preRegData?.displayName || 'Utilisateur',
            role: user.email === 'zeynad91@gmail.com' ? 'admin' : (preRegData?.role || 'client'),
            phone: preRegData?.phone || undefined,
            companyId: preRegData?.companyId || undefined,
            createdAt: serverTimestamp(),
          };

          await setDoc(doc(db, 'users', user.uid), newProfile);
          
          // Cleanup pre-registration document if it exists
          if (preRegId && preRegId !== user.uid) {
            try {
              await deleteDoc(doc(db, 'users', preRegId));
            } catch (cleanupErr) {
              console.warn("Could not cleanup pre-registration doc:", cleanupErr);
            }
          }

          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
