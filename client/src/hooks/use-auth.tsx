import { useState, useEffect } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName || "",
              role: userData.role || "user",
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: new Date(),
            };
            setUser(user);
            
            // Update last login
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              lastLogin: new Date(),
            });
            
            // Redirect after successful authentication
            if (window.location.pathname === '/auth') {
              window.location.href = user.role === 'admin' ? '/admin' : '/';
            }
          } else {
            // Create new user document (for Google sign-in)
            const usersSnapshot = await getDocs(collection(db, "users"));
            const isFirstUser = usersSnapshot.empty;
            
            const newUser = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || "",
              role: isFirstUser ? "admin" as const : "user" as const,
              createdAt: new Date(),
              lastLogin: new Date(),
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            const user = {
              id: firebaseUser.uid,
              ...newUser,
            };
            setUser(user);
            
            // Redirect after successful authentication
            if (window.location.pathname === '/auth') {
              window.location.href = user.role === 'admin' ? '/admin' : '/';
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      // Check if this is the first user (admin)
      const usersSnapshot = await getDocs(collection(db, "users"));
      const isFirstUser = usersSnapshot.empty;
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(result.user);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        displayName,
        role: isFirstUser ? "admin" : "user", // First user becomes admin
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      
      return { needsEmailVerification: true };
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (user?.role !== "admin") {
      throw new Error("Only admins can promote users");
    }
    
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "admin",
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    if (user?.role !== "admin") {
      throw new Error("Only admins can demote users");
    }
    
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "user",
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    promoteToAdmin,
    demoteFromAdmin,
  };
}
