import { useNavigate } from "react-router-dom";
import { logoutUser } from "../firebase";
import { Home, Search, Heart, PlusCircle, Users, Settings, LogOut } from "lucide-react";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/auth");
  };

  const commonLinks = [{ to: "/dashboard", label: "Dashboard", icon: Home }];

  const roleLinks = {
    buyer: [
      { to: "/search", label: "Search", icon: Search },
      { to: "/favorites", label: "Favorites", icon: Heart },
    ],
    agent: [
      { to: "/my-listings", label: "My Listings", icon: PlusCircle },
      { to: "/search", label: "Search", icon: Search },
    ],
    admin: [
      { to: "/manage-users", label: "Users", icon: Users },
      { to: "/manage-properties", label: "Properties", icon: Settings },
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
              <a
                key={link.label}
                href={link.to}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-green-700 hover:bg-green-50 transition"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </a>
            ))}
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 flex items-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}