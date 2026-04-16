import { useNavigate } from "react-router-dom";
import { logoutUser } from "../firebase";
import { Home, Search, Heart, PlusCircle, Users, Settings, LogOut, UserCircle, DollarSign, History } from "lucide-react";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userAvatar");
    navigate("/auth");
  };

  const commonLinks = [{ to: "/dashboard", label: "Dashboard", icon: Home }];

  const roleLinks = {
    buyer: [
      { to: "/search", label: "Search", icon: Search },
      { to: "/favorites", label: "Favorites", icon: Heart },
      { to: "/purchase-history", label: "Purchases", icon: History },
    ],
    agent: [
      { to: "/my-listings", label: "My Listings", icon: PlusCircle },
      { to: "/finance-history", label: "Finance", icon: DollarSign }, // replaces Search
    ],
    admin: [
      { to: "/manage-users", label: "Users", icon: Users },
      { to: "/manage-properties", label: "Properties", icon: Settings },
      { to: "/admin-finance", label: "Finance", icon: DollarSign },
    ],
  };

  const links = [...commonLinks, ...(roleLinks[role] || roleLinks.buyer)];

  return (
    <nav className="bg-white border-b border-green-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Home className="text-green-700" size={24} />
            <span className="text-xl font-bold text-green-800">HomeBot</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-green-700 hover:bg-green-50 transition"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </button>
            ))}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-1 px-3 py-2 rounded-md text-green-700 hover:bg-green-50 transition"
            >
              <UserCircle size={18} />
              <span>Profile</span>
            </button>
            <button onClick={handleLogout} className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}