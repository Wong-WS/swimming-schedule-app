import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import type { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signupWithEmail: (email: string, password: string, name: string, homeLocation: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // User signup with email and password
  const signupWithEmail = async (email: string, password: string, name: string, homeLocation: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, {
        email,
        name,
        homeLocation,
        role: 'user',
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Login with email and password
  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // If user doesn't exist, they're new from Google login
        // We'll redirect them to complete their profile (handled in component)
        console.log('New Google user, needs to complete profile');
      }
    } catch (error) {
      console.error('Error logging in with Google:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (uid: string, userData: Partial<User>) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        ...userData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserData(docSnap.data() as User);
      } else {
        console.log('No user profile found!');
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout
  };

  // Add debug logs for Firebase initialization
  useEffect(() => {
    console.log('AuthProvider initialized');
    console.log('Firebase auth available:', !!auth);
    try {
      // Try to access Firebase config
      const authConfig = auth.app.options;
      console.log('Firebase config available:', !!authConfig);
    } catch (err) {
      console.error('Error accessing Firebase config:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {/* Always render children, handle loading state in components */}
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
