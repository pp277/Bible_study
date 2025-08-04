import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<{ needsEmailVerification: boolean } | void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  promoteToAdmin: (userId: string) => Promise<void>;
  demoteFromAdmin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
