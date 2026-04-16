/**
 * Dashboard – Role‑based wrapper
 * 
 * Renders the appropriate dashboard component based on the user's role.
 * Also displays the persistent Navbar and a welcome message.
 * The role is passed from App.jsx (fetched from Firestore).
 */

import Navbar from "../components/Navbar";
import BuyerDashboard from "./BuyerDashboard";
import AgentDashboard from "./AgentDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard({ user, userName, role }) {
  // Wait until role is known (prevents flicker to wrong dashboard)
  if (!role) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

  // Select the correct dashboard component
  const renderDashboard = () => {
    switch (role) {
      case "admin": return <AdminDashboard />;
      case "agent": return <AgentDashboard />;
      default: return <BuyerDashboard />;
    }
  };

  const displayName = userName || user?.email?.split("@")[0] || "User";

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-900">Welcome, {displayName}</h1>
          <p className="text-green-600 mt-2">Logged in as <span className="font-semibold capitalize">{role}</span></p>
        </div>
        {renderDashboard()}
      </div>
    </div>
  );
}