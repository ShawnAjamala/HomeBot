import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./components/NotificationManager";
import AuthPage from "./pages/Authpage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ManageUsers from "./pages/ManageUsers";
import ManageProperties from "./pages/ManageProperties";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import MyListings from "./pages/MyListings";
import PurchaseHistory from "./pages/PurchaseHistory";
import FinanceHistory from "./pages/FinanceHistory";
import AdminFinance from "./pages/AdminFinance";
import Footer from "./components/Footer";

// Component that uses auth context and defines routes
const AppRoutes = () => {
  const { user, userName, role, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} userName={userName} role={role} /> : <Navigate to="/auth" />}
          />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/manage-users" element={user && role === "admin" ? <ManageUsers /> : <Navigate to="/dashboard" />} />
          <Route path="/manage-properties" element={user && role === "admin" ? <ManageProperties /> : <Navigate to="/dashboard" />} />
          <Route path="/admin-finance" element={user && role === "admin" ? <AdminFinance /> : <Navigate to="/dashboard" />} />
          <Route path="/search" element={user ? <Search /> : <Navigate to="/auth" />} />
          <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/auth" />} />
          <Route path="/my-listings" element={user && role === "agent" ? <MyListings /> : <Navigate to="/dashboard" />} />
          <Route path="/purchase-history" element={user && role === "buyer" ? <PurchaseHistory /> : <Navigate to="/dashboard" />} />
          <Route path="/finance-history" element={user && role === "agent" ? <FinanceHistory /> : <Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;