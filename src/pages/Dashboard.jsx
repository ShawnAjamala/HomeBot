import Navbar from "../components/Navbar";
import BuyerDashboard from "./BuyerDashboard";
import AgentDashboard from "./AgentDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard({ user, userName, role }) {
  const renderDashboard = () => {
    switch (role) {
      case "admin":
        return <AdminDashboard />;
      case "agent":
        return <AgentDashboard />;
      default:
        return <BuyerDashboard />;
    }
  };

  const displayName = userName || (user?.email ? user.email.split('@')[0] : "User");

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-green-900">Welcome, {displayName}</h1>
        <p className="text-green-600 mt-2">You are logged in as <span className="font-semibold capitalize">{role}</span></p>
        <div className="mt-8">
          {renderDashboard()}
        </div>
      </div>
    </div>
  );
}