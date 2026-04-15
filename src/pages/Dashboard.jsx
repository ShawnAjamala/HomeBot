import Navbar from "../components/Navbar";
import BuyerDashboard from "./BuyerDashboard";
import AgentDashboard from "./AgentDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard({ user, userName, role }) {
  // If role is null or undefined, default to buyer (should not happen if localStorage has role)
  const effectiveRole = role || "buyer";
  const displayName = userName || user?.email?.split("@")[0] || "User";

  const renderDashboard = () => {
    switch (effectiveRole) {
      case "admin":
        return <AdminDashboard user={user} />;
      case "agent":
        return <AgentDashboard user={user} />;
      default:
        return <BuyerDashboard user={user} />;
    }
  };

  return (
    <div>
      <Navbar role={effectiveRole} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-900">Welcome, {displayName}</h1>
          <p className="text-green-600 mt-2">Logged in as <span className="font-semibold capitalize">{effectiveRole}</span></p>
        </div>
        {renderDashboard()}
      </div>
    </div>
  );
}