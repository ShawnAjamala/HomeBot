/**
 * Navbar – Role‑based navigation bar
 * 
 * Displays different navigation links depending on the user's role (buyer, agent, admin).
 * Includes a mobile hamburger menu that toggles the link list on small screens.
 * Uses Tailwind CSS for responsive design.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../firebase";
import { Home, Search, Heart, PlusCircle, Users, Settings, LogOut, UserCircle, Menu, X, DollarSign, History } from "lucide-react";

export default function Navbar({ role }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle state
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userAvatar");
    navigate("/auth");
  };

  // Common links for all roles
  const commonLinks = [{ to: "/dashboard", label: "Dashboard", icon: Home }];

  // Role‑specific links
  const roleLinks = {
    buyer: [
      { to: "/search", label: "Search", icon: Search },
      { to: "/favorites", label: "Favorites", icon: Heart },
      { to: "/purchase-history", label: "Purchases", icon: History },
    ],
    agent: [
      { to: "/my-listings", label: "My Listings", icon: PlusCircle },
      { to: "/finance-history", label: "Finance", icon: DollarSign },
    ],
    admin: [
      { to: "/manage-users", label: "Users", icon: Users },
      { to: "/manage-properties", label: "Properties", icon: Settings },
      { to: "/admin-finance", label: "Finance", icon: DollarSign },
    ],
  };

  // Combine common + role links; fallback to buyer if role undefined
  const links = [...commonLinks, ...(roleLinks[role] || roleLinks.buyer)];

  return (
    <nav className="bg-white border-b border-green-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Home className="text-green-700" size={24} />
            <span className="text-xl font-bold text-green-800">HomeBot</span>
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
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

          {/* Mobile menu button (visible on small screens) */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-green-700">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation (dropdown) */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-green-100">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  navigate(link.to);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-green-700 hover:bg-green-50 transition"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                navigate("/profile");
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-green-700 hover:bg-green-50 transition"
            >
              <UserCircle size={18} /> Profile
            </button>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}