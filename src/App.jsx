 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ManageUsers from "./pages/ManageUsers";
import ManageProperties from "./pages/ManageProperties";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";


function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name);
          setRole(data.role);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userRole", data.role);
        } else {
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
        localStorage.removeItem("userAvatar");
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
        <Route path="/dashboard" element={user ? <Dashboard user={user} userName={userName} role={role} /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
        <Route path="/manage-users" element={user && role === "admin" ? <ManageUsers /> : <Navigate to="/dashboard" />} />
        <Route path="/manage-properties" element={user && role === "admin" ? <ManageProperties /> : <Navigate to="/dashboard" />} />
        <Route path="/search" element={user ? <Search /> : <Navigate to="/auth" />} />
        <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/auth" />} />
       
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;