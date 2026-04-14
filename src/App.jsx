import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [role, setRole] = useState(localStorage.getItem("userRole") || "buyer");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const savedName = localStorage.getItem("userName");
        const savedRole = localStorage.getItem("userRole");
        if (savedName) setUserName(savedName);
        if (savedRole) setRole(savedRole);
      } else {
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        setUserName("");
        setRole("buyer");
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!authChecked) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} userName={userName} role={role} /> : <Navigate to="/auth" />}
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;