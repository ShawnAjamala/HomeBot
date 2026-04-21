import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch from Firestore as source of truth
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.name);
            setRole(data.role);
            // Update localStorage cache
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userRole", data.role);
          } else {
            // Fallback for users created directly in Firebase console (should not happen)
            const fallback = firebaseUser.email.split("@")[0];
            setUserName(fallback);
            setRole("buyer");
            localStorage.setItem("userName", fallback);
            localStorage.setItem("userRole", "buyer");
          }
        } catch (err) {
          console.error("AuthContext error:", err);
          const fallback = firebaseUser.email.split("@")[0];
          setUserName(fallback);
          setRole("buyer");
          localStorage.setItem("userName", fallback);
          localStorage.setItem("userRole", "buyer");
        }
      } else {
        setUser(null);
        setUserName("");
        setRole(null);
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userName, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};