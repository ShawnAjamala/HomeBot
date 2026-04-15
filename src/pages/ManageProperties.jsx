import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [role, setRole] = useState("admin"); // fallback

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("homebot_properties") || "[]");
    setProperties(stored);
    const userRole = localStorage.getItem("userRole");
    if (userRole) setRole(userRole);
  }, []);

  const approveProperty = (propId) => {
    const updated = properties.map(p => p.id === propId ? { ...p, approved: true } : p);
    localStorage.setItem("homebot_properties", JSON.stringify(updated));
    setProperties(updated);
  };

  const deleteProperty = (propId) => {
    if (window.confirm("Delete this property?")) {
      const updated = properties.filter(p => p.id !== propId);
      localStorage.setItem("homebot_properties", JSON.stringify(updated));
      setProperties(updated);
    }
  };

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Manage Properties</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">{p.address}</td>
                    <td className="px-6 py-4">${p.price?.toLocaleString()}</td>
                    <td className="px-6 py-4">{p.agentName}</td>
                    <td className="px-6 py-4">{p.approved ? <span className="text-green-600">Approved</span> : <span className="text-yellow-600">Pending</span>}</td>
                    <td className="px-6 py-4 flex gap-2">
                      {!p.approved && <button onClick={() => approveProperty(p.id)} className="text-green-600"><Check size={18} /></button>}
                      <button onClick={() => deleteProperty(p.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-gray-500">No properties yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}