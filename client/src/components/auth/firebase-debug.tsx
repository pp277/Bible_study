import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function FirebaseDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 Auth State Change:", user ? "LOGGED IN" : "LOGGED OUT");
      
      if (user) {
        console.log("🔥 User UID:", user.uid);
        console.log("🔥 User Email:", user.email);
        console.log("🔥 User Display Name:", user.displayName);
        
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          console.log("🔥 Firestore User Doc Exists:", userDoc.exists());
          if (userDoc.exists()) {
            console.log("🔥 Firestore User Data:", userDoc.data());
          }
        } catch (error) {
          console.error("🔥 Firestore Error:", error);
        }
      }
      
      setDebugInfo({
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        } : null,
        timestamp: new Date().toISOString()
      });
    });

    return unsubscribe;
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999 
    }}>
      <h4>🔥 Firebase Debug</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}